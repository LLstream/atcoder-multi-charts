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
              'Pragma': 'no-cache',
              'Expires': '0',
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
  const Ratingdatasets: DatasetType[] = Object.entries(userDatas).map(([user, dataList], index) => {
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

  const Ratinglabels = Array.from(allDatesSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // 各データセットのデータをラベルに合わせる
  Ratingdatasets.forEach((dataset) => {
    const userData = userDatas[dataset.label]?.filter((item) => item.IsRated);
    dataset.data = Ratinglabels.map((label) => {
      const dataItem = userData?.find(
        (item) => new Date(item.EndTime).toLocaleDateString() === label
      );
      return dataItem ? dataItem.NewRating : null;
    });
  });

  const RatingChartData = {
    labels: Ratinglabels,
    datasets: Ratingdatasets,
  };

  const Performancedatasets: DatasetType[] = Object.entries(userDatas).map(([user, dataList], index) => {
    const ratedData = dataList.filter((item) => item.IsRated);
    // "EndTime"でデータをソート
    ratedData.sort(
      (a, b) => new Date(a.EndTime).getTime() - new Date(b.EndTime).getTime()
    );
    // ラベル用の日付を収集
    ratedData.forEach((item) => {
      allDatesSet.add(new Date(item.EndTime).toLocaleDateString());
    });
    // ユーザーごとのパフォーマンスデータを準備
    return {
      label: user,
      data: ratedData.map((item) => item.Performance),
      fill: false,
      borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`, // 色相を変えて色を設定
      tension: 0.1,
    };
  });

  const Performancelabels = Array.from(allDatesSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // 各データセットのデータをラベルに合わせる
  Performancedatasets.forEach((dataset) => {
    const userData = userDatas[dataset.label]?.filter((item) => item.IsRated);
    dataset.data = Performancelabels.map((label) => {
      const dataItem = userData?.find(
        (item) => new Date(item.EndTime).toLocaleDateString() === label
      );
      return dataItem ? dataItem.Performance : null;
    });
  });

  const PerformanceChartData = {
    labels: Performancelabels,
    datasets: Performancedatasets,
  };

  useEffect(() => {
    console.log('userDatas has been updated:', userDatas); // デバッグ用ログ
  }, [userDatas]);

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
      {/* グラフを表示 */}
      {Object.keys(userDatas).length > 0 && (
        <div>
          <h2>New Rating over Time</h2>
          <Line
            data={RatingChartData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
              spanGaps: true, // データがない部分を線でつなげないようにする
            }}
          />
          <h2>Performance over Time</h2>
          <Line
            data={PerformanceChartData}
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
    </div>
  );
}
