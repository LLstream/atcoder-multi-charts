import { NextResponse } from 'next/server';

// GETメソッド用のハンドラー
export async function GET(request: Request, { params }: { params: { username: string } }) {
  const { username } = params; // URLからユーザー名を取得
  const apiUrl = `https://atcoder.jp/users/${username}/history/json`; // ユーザー名を含む外部APIのエンドポイント

  try {
    // 遅延を追加
    await new Promise(resolve => setTimeout(resolve, 40));
    // 外部APIにリクエストを送信
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 必要に応じてAPIキーや追加ヘッダーを設定
      },
    });

    // レスポンスが正常でない場合はエラーレスポンスを返す
    if (!response.ok) {
      return NextResponse.json({ error: 'Error fetching data' }, { status: response.status });
    }

    // データをJSON形式で取得
    const data = await response.json();

    // データをレスポンスとして返す
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // リクエストが失敗した場合のエラーハンドリング
    return NextResponse.json({ error: 'Failed to fetch data from external API' }, { status: 500 });
  }
}
