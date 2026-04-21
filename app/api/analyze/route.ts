import { NextResponse } from "next/server";  
  
export async function POST(req: Request) {  
  try {  
    // === 这里是我们新加的探测器 ===  
    console.log("===============================");  
    const apiKey = process.env.DASHSCOPE_API_KEY;  
    if (!apiKey) {  
      console.log("❌ 糟糕！程序完全没找到 API Key！这说明 .env.local 文件位置不对或名字错了。");  
    } else {  
      console.log("✅ 程序读到了 API Key，前几个字符是：", apiKey.substring(0, 6) + "******");  
      if (!apiKey.startsWith("sk-")) {  
        console.log("⚠️ 警告：你的密码不是 sk- 开头！你可能复制错地方了！");  
      }  
    }  
    console.log("===============================");  
    // ==================================  
  
    const { image } = await req.json();   
      
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {  
      method: "POST",  
      headers: {  
        "Authorization": `Bearer ${apiKey}`,  
        "Content-Type": "application/json",  
      },  
      body: JSON.stringify({  
        model: "qwen-vl-plus",   
        messages: [{  
          role: "user",  
          content: [  
            { type: "text", text: '你是一个专业的营养师。请分析图片中的食物，估算总热量。严格且只返回JSON格式，格式如下：{"n":"食物名称","c":卡路里数字,"d":"一句简短的营养评价"}。不要输出任何其他多余的文字、解释或Markdown标记。' },  
            { type: "image_url", image_url: { url: image } }  
          ]  
        }]  
      }),  
    });  
  
    const data = await response.json();  
      
    if (data.error) {  
      console.error("AI 接口报错:", data.error);  
      return NextResponse.json({ n: "AI 识别出错", c: 0, d: "请检查 API Key 是否正确填写" }, { status: 500 });  
    }  
  
    const textResult = data.choices[0].message.content.replace(/```json|```/g, "").trim();  
    return NextResponse.json(JSON.parse(textResult));  
  
  } catch (error) {  
    console.error("解析出错:", error);  
    return NextResponse.json({ n: "AI 识别失败", c: 0, d: "可能是图片太大或网络拥堵，请重试" }, { status: 500 });  
  }  
}  
