'use client'; // フロントエンド用のコンポーネントを指定
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

import { useState } from 'react';

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
  data: (number | null)[]; // 型を (number | null)[] に変更
  fill: boolean;
  borderColor: string;
  tension: number;
};

export default function FetchUserData() {
  const [usernames, setUsernames] = useState<string[]>(['']); // ユーザー名の配列状態
  const [userDatas, setUserDatas] = useState<{ [key: string]: ContestData[] }>({}); // ユーザーごとのデータ
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

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

    const newUserDatas: { [key: string]: ContestData[] } = {};

    try {
      for (const user of validUsernames) {
        // API Routesを通じて外部APIデータを取得
        const res = await fetch(`/api/users/${user}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch data for user: ${user}`);
        }
        const result: ContestData[] = await res.json(); // 配列としてデータを取得
        newUserDatas[user] = result; // ユーザーごとのデータを保存
      }
      setUserDatas(newUserDatas); // 全ユーザーのデータをstateに保存
      setError(null); // エラーをクリア
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // エラーメッセージを設定
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  // 全てのユーザーの"IsRated"がtrueのデータのみを収集
  const allDatesSet = new Set<string>();
  const datasets: DatasetType[] = Object.entries(userDatas).map(([user, dataList], index) => {
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
      <button onClick={fetchData}>データを取得</button>
      {error && <p>Error: {error}</p>}
      {/* グラフを表示 */}
      {Object.keys(userDatas).length > 0 && (
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
    </div>
  );
}
