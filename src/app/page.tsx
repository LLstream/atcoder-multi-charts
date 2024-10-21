'use client'; // フロントエンド用のコンポーネントを指定

import { useState } from 'react';


export default function FetchUserData() {
  const [username, setUsername] = useState<string>(''); // ユーザー名の状態
  const [data, setData] = useState<string | null>(null); // 取得したデータ
  const [dataList, setDataList] = useState<string[]>([]); // 取得したデータのリスト
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  const fetchData = async () => {
    if (!username) {
      setError('ユーザー名を入力してください。');
      return;
    }

    try {
      // API Routesを通じて外部APIデータを取得
      const res = await fetch(`/api/users/${username}`); // ユーザー名をURLに含めてリクエスト
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const result: string = await res.json(); // 型定義を使用してデータを取得
      setData(result); // 取得したデータをstateに保存
      if (dataList.length > 0) {
        setDataList((prevDataList) => [...prevDataList, result]);
      } else {
        setDataList([result]);
      }
      setError(null); // エラーをクリア
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // エラーメッセージを設定
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="ユーザー名を入力"
        value={username}
        onChange={(e) => setUsername(e.target.value)} // 入力値を更新
      />
      <button onClick={fetchData}>データを取得</button>
      {error && <p>Error: {error}</p>}
      {/* {data && (
        <div>
          <h1>取得したユーザーデータ:</h1>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )} */}
      {dataList.length > 0 && (
        <div>
          <h1>取得したユーザーデータ:</h1>
          {dataList.map((data, index) => (
            <pre key={index}>{JSON.stringify(data, null, 2)}</pre>
          ))}
        </div>
      )}
    </div>
  );
}
