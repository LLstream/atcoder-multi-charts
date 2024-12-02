'use client'; // フロントエンド用のコンポーネントを指定
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

import { useState, useEffect } from 'react';

interface ContestData {
  IsRated: boolean;
  Place: number;
  OldRating: number;
  NewRating: number;
  Performance: number;
  InnerPerformance: number;
  ContestScreenName: string;
  ContestName: string;
  ContestNameEn: string;
  EndTime: string;
  Result: string;
}

// データセットの型定義を更新
type DatasetType = {
  label: string;
  data: (number | null)[];
  fill: boolean;
  borderColor: string;
  tension: number;
};

export default function FetchUserData() {
  const [usernames, setUsernames] = useState<string[]>(['']); // ユーザー名の配列状態
  const [userDatas, setUserDatas] = useState<{ [key: string]: ContestData[] }>({}); // ユーザーごとのデータ
  const [error, setError] = useState<string | null>(null); // エラーメッセージ
  const [isLoading, setIsLoading] = useState<boolean>(false); // ローディング状態

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newUsernames = [...usernames];
    newUsernames[index] = e.target.value;
    setUsernames(newUsernames);

    // 最後の入力ボックスが空でなければ新しいボックスを追加
    if (index === usernames.length - 1 && e.target.value.trim() !== '') {
      setUsernames([...newUsernames, '']);
    }
  };

  const fetchData = async () => {
    const validUsernames = usernames.filter((name) => name.trim() !== '');
    if (validUsernames.length === 0) {
      setError('ユーザー名を入力してください。');
      return;
    }

    setIsLoading(true); // ローディング開始
    setError(null); // エラーをクリア
    setUserDatas({}); // 古いデータをクリア

    try {
      // ユーザーごとのデータを並行して取得
      const results = await Promise.all(
        validUsernames.map(async (user) => {
          // キャッシュを無効化するためにタイムスタンプをクエリパラメータに追加
          const timestamp = Date.now();
          const res = await fetch(`/api/users/${user}?t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
              Expires: '0',
            },
            cache: 'no-store', // キャッシュを無効化
          });
          if (!res.ok) {
            throw new Error(`Failed to fetch data for user: ${user}`);
          }
          const result: ContestData[] = await res.json();
          console.log(`Fetched data for ${user}:`, result); // デバッグ用ログ
          return [user, result] as [string, ContestData[]];
        })
      );
      const newUserDatas = Object.fromEntries(results);
      setUserDatas(newUserDatas);
      console.log('Updated userDatas:', newUserDatas); // デバッグ用ログ
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  // 全てのユーザーの"IsRated"がtrueのデータのみを収集
  const allDatesSet = new Set<string>();
  const datasets: DatasetType[] = Object.entries(userDatas)
    .filter(([user, dataList]) => dataList.length > 0) // 有効なデータのみ使用
    .map(([user, dataList], index) => {
      const ratedData = dataList.filter((item) => item.IsRated);
      // "EndTime"でデータをソート
      ratedData.sort(
        (a, b) => new Date(a.EndTime).getTime() - new Date(b.EndTime).getTime()
      );
      // ラベル用の日付を収集
      ratedData.forEach((item) => {
        allDatesSet.add(new Date(item.EndTime).toLocaleDateString());
      });
      // ユーザーごとのレーティングデータを準備
      return {
        label: user,
        data: ratedData.map((item) => item.NewRating),
        fill: false,
        borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`, // 色相を変えて色を設定
        tension: 0.1,
      };
    });

  const labels = Array.from(allDatesSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // 各データセットのデータをラベルに合わせる
  datasets.forEach((dataset) => {
    const userData = userDatas[dataset.label]?.filter((item) => item.IsRated);
    dataset.data = labels.map((label) => {
      const dataItem = userData?.find(
        (item) => new Date(item.EndTime).toLocaleDateString() === label
      );
      return dataItem ? dataItem.NewRating : null;
    });
  });

  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  useEffect(() => {
    console.log('userDatas has been updated:', userDatas); // デバッグ用ログ
  }, [userDatas]);

  // ----AtCoder Problemsのデータを取得する関数---
  const fetchUserData = async (username: string) => {
    setIsLoading(true); // ローディング開始
    setError(null); // エラーをクリア
    try {
      const response = await fetch(
        `https://kenkoooo.com/atcoder/atcoder-api/results?user=${username}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data for user: ${username}`);
      }
      const data: ContestData[] = await response.json();
      setUserDatas((prevData) => ({ ...prevData, [username]: data }));
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  const handleFetchData = () => {
    usernames.forEach((username) => {
      if (username) {
        fetchUserData(username);
      }
    });
  };

  // 参加コンテスト数を取得
  const calculateContestCount = (data: ContestData[]) => {
    return data.length;
  };

  // 最高レーティングを取得
  const calculateMaxRating = (data: ContestData[]) => {
    if (data.length === 0) {
      return 'データがありません';
    }
    return Math.max(...data.map((item) => item.NewRating));
  };

  // 最新のレーティングを取得
  const calculateLatestRating = (data: ContestData[]) => {
    if (data.length === 0) {
      return 'データがありません';
    }
    return data[data.length - 1].NewRating;
  };

  // 直近のレーティング変化
  const calculateLatestRatingChange = (data: ContestData[]) => {
    if (data.length < 2) {
      return 'データが不足しています';
    }
    return data[data.length - 1].NewRating - data[data.length - 2].NewRating;
  };

  // 無効なユーザー名を取得
  const invalidUsernames = Object.entries(userDatas)
    .filter(([username, data]) => data.length === 0)
    .map(([username]) => `"${username}"`);

  // 有効なユーザーデータのみを使用
  const validUserDatas = Object.entries(userDatas).filter(
    ([username, data]) => data.length > 0
  );

  return (
    <div>
      <h3>ユーザー名を入力してください：</h3>
      {usernames.map((name, index) => (
        <input
          key={index}
          type="text"
          placeholder={`ユーザー名を入力`}
          value={name}
          onChange={(e) => handleUsernameChange(e, index)}
          style={{ display: 'block', marginBottom: '8px' }}
        />
      ))}
      <button onClick={fetchData} disabled={isLoading}>
        データを取得
      </button>
      {isLoading && <p>データを取得中...</p>}
      {error && <p>Error: {error}</p>}
      {/* 無効なユーザー名がある場合に表示 */}
      {invalidUsernames.length > 0 && (
        <p>ユーザー名が誤っています: {invalidUsernames.join(', ')}</p>
      )}
      {/* グラフを表示 */}
      {validUserDatas.length > 0 && (
        <div>
          <h2>New Rating over Time</h2>
          <Line
            data={chartData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
              spanGaps: true, // データがない部分を線でつなげないようにする
            }}
          />
        </div>
      )}
      {/* AtCoder Problemsのデータを表示 */}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {validUserDatas.map(([username, data]) => (
          <div key={username} style={{ margin: '1rem' }}>
            <h3>{username}のコンテストデータ</h3>
            <p>参加コンテスト数 (Rated, UnRated): {calculateContestCount(data)}</p>
            <p>最高レーティング: {calculateMaxRating(data)}</p>
            <p>最新のレーティング: {calculateLatestRating(data)}</p>
            <p>直近のレーティング変化: {calculateLatestRatingChange(data)}</p>
            <br />
          </div>
        ))}
      </div>
    </div>
  );
}
