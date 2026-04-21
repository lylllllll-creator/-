"use client";                
            
import { useState, useEffect } from "react";                
import Link from "next/link";             
          
// 定义所有餐段选项          
const MEAL_TYPES = [          
  { id: 'breakfast', icon: '🍳', name: '早餐' },          
  { id: 'lunch', icon: '🍱', name: '午餐' },          
  { id: 'dinner', icon: '🥗', name: '晚餐' },          
  { id: 'snack', icon: '🍎', name: '加餐' },          
  { id: 'midnight', icon: '🍜', name: '夜宵' }          
];          
                
export default function Home() {                
  // 核心业务状态      
  const [img, setImg] = useState<string | null>(null);                
  const [isAnalyzing, setIsAnalyzing] = useState(false);                
  const [result, setResult] = useState<any>(null);                
  const [isSaving, setIsSaving] = useState(false);              
  const [saveSuccess, setSaveSuccess] = useState(false);              
  const [selectedMeal, setSelectedMeal] = useState('lunch');          
      
  // 数据面板状态    
  const [showSummary, setShowSummary] = useState(false);      
  const [summaryData, setSummaryData] = useState({ intake: 0, bmr: 1350, exercise: 0, targetDeficit: -300 });      
  const [dateString, setDateString] = useState("");    
    
  // 初始化：获取今天日期和真实数据    
  useEffect(() => {    
    const d = new Date();    
    setDateString(`${d.getMonth() + 1}月${d.getDate()}日`);    
        
    // 页面加载时拉取今天的真实数据，让首页看板亮起来    
    fetchTodayData();    
  }, []);    
    
  const fetchTodayData = async () => {    
    const d = new Date();      
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;      
          
    try {      
      const [foodRes, settingsRes] = await Promise.all([      
        fetch(`/api/food?date=${dateStr}`),      
        fetch(`/api/settings`)      
      ]);      
      const foodData = await foodRes.json();      
      const settingsData = await settingsRes.json();      
      
      let intake = 0;      
      if (foodData.success && foodData.data) {      
        intake = foodData.data.reduce((sum: number, item: any) => sum + (Number(item.calories) || 0), 0);      
      }      
            
      let bmr = 1350;      
      if (settingsData.success && settingsData.data?.bmr) {      
        bmr = settingsData.data.bmr;      
      }      
      
      setSummaryData(prev => ({ ...prev, intake, bmr }));      
    } catch (err) {      
      console.error("获取统计数据失败", err);      
    }      
  };    
                
  // 图片上传逻辑      
  const handleImageUpload = (e: any) => {                 
    const file = e.target.files?.[0];                
    if (file) {                 
      const reader = new FileReader();                
      reader.onloadend = () => {                
        setImg(reader.result as string);                
        setResult(null);               
        setSaveSuccess(false);               
      };                
      reader.readAsDataURL(file);                
    }                 
  };                
                
  // AI 分析逻辑      
  const analyzeImage = async () => {                 
    if (!img) return;                
    setIsAnalyzing(true);                 
    setSaveSuccess(false);               
                    
    try {                
      const response = await fetch("/api/analyze", {                
        method: "POST",                
        headers: { "Content-Type": "application/json" },                
        body: JSON.stringify({ image: img })               
      });                
      const data = await response.json();                
      setResult(data);                
    } catch (error) {                
      setResult({ n: "网络出小差了", c: 0, d: "请稍后再试哦🌿" });                
    } finally {                
      setIsAnalyzing(false);                 
    }                
  };                
              
  // 保存到数据库逻辑      
  const saveToDatabase = async () => {              
    if (!result) return;              
    setIsSaving(true);              
        
    const d = new Date();        
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;        
                  
    try {              
      const response = await fetch("/api/food", {              
        method: "POST",              
        headers: { "Content-Type": "application/json" },              
        body: JSON.stringify({         
          date: dateStr,       
          food: {               
            name: result.n,               
            calories: Number(result.c),              
            analysis: result.d,            
            imageUrl: img,          
            mealType: selectedMeal         
          }        
        })               
      });              
                    
      const data = await response.json();              
      if (data.success) {              
        setSaveSuccess(true);    
        // 保存成功后刷新一下今天的数据    
        fetchTodayData();    
      } else {              
        alert("保存失败了");              
      }              
    } catch (error) {              
      alert("网络出小差了，没保存上😢");              
    } finally {              
      setIsSaving(false);              
    }              
  };              
      
  // 展开底部总结卡片    
  const handleOpenSummary = () => {      
    fetchTodayData(); // 展开前再刷新一次确保最新    
    setShowSummary(true);      
  };      
      
  // 计算进度条和目标数据    
  // 假设目标热量 = BMR + 活动消耗 + 设定的缺口(负数)    
  const dailyGoal = summaryData.bmr + Math.abs(summaryData.targetDeficit); // 这里简单把缺口转正作为预算参考    
  const remainingCals = Math.max(0, dailyGoal - summaryData.intake);    
  const progressPercent = Math.min(100, (summaryData.intake / dailyGoal) * 100) || 0;    
  const currentDeficit = summaryData.intake - summaryData.bmr - summaryData.exercise;      
                
  return (                
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">                
            
      {/* 核心主卡片 */}      
      <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center border border-gray-100 z-10 relative flex flex-col min-h-[600px]">                
            
        {/* App Header (支持动态日期) */}    
        <div className="flex justify-between items-center mb-6">    
            <h1 className="text-2xl font-black text-gray-800 tracking-wide flex items-center gap-1.5">    
                SnapCal <span className="text-xl">🍕</span>    
            </h1>    
            <div className="bg-gray-50 border border-gray-100 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">    
                {dateString}    
            </div>    
        </div>    
    
        {/* ---------------- 状态1：未选择图片（全新优化版首页） ---------------- */}    
        {!img && (    
          <div className="flex flex-col flex-grow">    
            {/* 数据前置看板 */}    
            <div className="bg-white rounded-[24px] p-6 text-left relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8">    
                <div className="flex items-center justify-between mb-2">    
                    <h2 className="text-gray-400 text-sm font-bold flex items-center gap-1">    
                        🎯 今日还可以吃    
                    </h2>    
                    <div className="w-2 h-2 rounded-full bg-[#3CA873] animate-pulse"></div>    
                </div>    
                    
                <div className="text-[42px] font-black text-gray-800 tracking-tight mb-5 flex items-baseline gap-1">    
                    {remainingCals} <span className="text-base font-bold text-gray-300">kcal</span>    
                </div>    
                    
                {/* 动态进度条 */}    
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4 shadow-inner">    
                    <div     
                      className="bg-gradient-to-r from-[#59D192] to-[#3CA873] h-full rounded-full transition-all duration-1000 ease-out"     
                      style={{ width: `${progressPercent}%` }}    
                    ></div>    
                </div>    
    
                <div className="flex gap-2">    
                    <div className="flex-1 bg-[#FFF5F0] border border-[#FFE4D6] rounded-xl p-2.5 flex flex-col gap-0.5">    
                        <span className="text-[10px] font-bold text-[#FF8A4C]">🍽️ 已摄入</span>    
                        <span className="text-sm font-black text-gray-700">{summaryData.intake}</span>    
                    </div>    
                    <div className="flex-1 bg-[#F0F4FF] border border-[#DCE7FF] rounded-xl p-2.5 flex flex-col gap-0.5">    
                        <span className="text-[10px] font-bold text-[#5085E5]">🏃 运动消耗</span>    
                        <span className="text-sm font-black text-gray-700">{summaryData.exercise}</span>    
                    </div>    
                </div>    
            </div>    
                
            <div className="flex-grow"></div>    
    
            {/* 核心操作按钮 */}    
            <div className="mb-4">    
                <label className="cursor-pointer w-full text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-lg tracking-wide flex justify-center items-center gap-2 bg-[#3CA873] shadow-[0_8px_20px_rgba(60,168,115,0.25)]">    
                    <span className="text-2xl drop-shadow-sm">📸</span>     
                    <span>记录新的一餐</span>    
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />      
                </label>    
            </div>    
                
            {/* 次要功能按钮组 */}    
            <div className="grid grid-cols-2 gap-3">    
                <button onClick={handleOpenSummary} className="bg-[#EEF4FF] hover:bg-[#E4EEFF] border border-[#DCE7FF] rounded-[18px] p-4 flex flex-col items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group">    
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">📋</span>    
                    <span className="text-[13px] font-bold text-[#5085E5]">今日饮食详情</span>    
                </button>    
                    
                <Link href="/statistics" className="bg-[#F4EFFB] hover:bg-[#EBE2F8] border border-[#E7DBF5] rounded-[18px] p-4 flex flex-col items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group">    
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">📈</span>    
                    <span className="text-[13px] font-bold text-[#8B6CE0]">历史热量看板</span>    
                </Link>    
            </div>    
          </div>    
        )}    
    
        {/* ---------------- 状态2：已选择图片及分析流程 ---------------- */}    
        {img && (    
          <div className="flex flex-col flex-grow">    
            {/* 图片与动画展示区 */}      
            <div className="mb-6 relative rounded-2xl overflow-hidden shadow-sm aspect-video">                
              <img src={img} alt="food" className="w-full h-full object-cover" />                
              {isAnalyzing && (                
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-[#3CA873] font-bold tracking-wide">                
                  AI 营养师观察中...                
                </div>                
              )}                
            </div>                
                            
            {/* 分析结果展示框 (带营养素胶囊) */}      
            {result && !isAnalyzing && (                
              <div className="mb-6 bg-[#3CA873]/5 p-5 rounded-2xl text-left border border-[#3CA873]/20 relative">                
                <div className="flex justify-between items-start mb-1">    
                  <h3 className="text-lg font-bold text-gray-800">{result.n}</h3>                
                  <span className="bg-white border border-gray-200 text-gray-500 text-xs px-2 py-1 rounded-md font-medium shadow-sm">1 份</span>    
                </div>    
                <p className="text-4xl font-black text-[#3CA873] my-1 tracking-tight flex items-baseline gap-1">                
                  {result.c} <span className="text-sm font-bold text-[#3CA873]/70">kcal</span>                
                </p>                
                    
                <div className="flex gap-2 mt-3 mb-3">    
                  <div className="bg-red-50 border border-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">    
                    🥩 蛋白 {result.protein || 18}g    
                  </div>    
                  <div className="bg-yellow-50 border border-yellow-100 text-yellow-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">    
                    🍚 碳水 {result.carbs || 65}g    
                  </div>    
                  <div className="bg-orange-50 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">    
                    🧈 脂肪 {result.fat || 22}g    
                  </div>    
                </div>    
    
                <div className="w-full h-px bg-[#3CA873]/10 my-3"></div>    
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{result.d}</p>                
              </div>                
            )}                
                            
            <div className="flex flex-col gap-3.5 mt-auto">                
                    
              {/* 餐段选择区域 */}          
              {!isAnalyzing && !saveSuccess && (          
                <div className="mb-2 text-left">          
                  <p className="text-xs font-bold text-gray-400 mb-2">🏷️ 标记你的餐段：</p>          
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>          
                    {MEAL_TYPES.map(m => (          
                      <button           
                        key={m.id}          
                        onClick={() => setSelectedMeal(m.id)}          
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${          
                          selectedMeal === m.id           
                          ? 'bg-[#F4C745] text-white border-[#F4C745] shadow-md'           
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'          
                        }`}          
                      >          
                        {m.icon} {m.name}          
                      </button>          
                    ))}          
                  </div>          
                </div>          
              )}          
              
              {/* 分析按钮 */}      
              {!result && !isAnalyzing && (                
                <button                 
                  onClick={analyzeImage}                 
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-base tracking-wide flex justify-center items-center gap-2 bg-[#3CA873] shadow-[0_4px_12px_rgba(60,168,115,0.25)]"      
                >                
                  <span>✨</span> 让 AI 算算                
                </button>                
              )}                
                  
              {/* 保存按钮 */}      
              {result && !isAnalyzing && !saveSuccess && (              
                <button               
                  onClick={saveToDatabase}              
                  disabled={isSaving}              
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-base tracking-wide flex justify-center items-center gap-2 bg-[#3CA873] shadow-[0_4px_12px_rgba(60,168,115,0.25)]"    
                >              
                  {isSaving ? "💾 正在保存..." : "💾 保存这条记录"}              
                </button>              
              )}              
    
              {/* 保存成功后的动线引导按钮 */}    
              {saveSuccess && (    
                <button     
                  onClick={handleOpenSummary}    
                  className="w-full bg-[#EEF7F2] border border-[#3CA873]/30 text-[#3CA873] font-bold py-4 rounded-2xl transition-all duration-300 transform hover:bg-[#E3F2E9] hover:-translate-y-0.5 active:translate-y-0 text-base tracking-wide flex justify-center items-center gap-2 shadow-sm group"    
                >    
                  <span className="text-lg">✅</span>     
                  <span>已存入，查看今日总结</span>    
                  <span className="group-hover:translate-x-1 transition-transform ml-1">➔</span>    
                </button>    
              )}    
                  
              {/* 换图/继续记录按钮 */}      
              <label className={`cursor-pointer w-full font-medium py-3.5 text-center rounded-2xl transition-colors border ${    
                saveSuccess     
                  ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-100"     
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-transparent"    
              }`}>      
                {saveSuccess ? "继续记录下一餐" : "换一张图片"}      
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />      
              </label>      
            </div>    
          </div>    
        )}    
      </div>                
      
      {/* 半透明遮罩 */}      
      {showSummary && (      
        <div       
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"      
          onClick={() => setShowSummary(false)}      
        ></div>      
      )}      
      
      {/* 弹出的热量结算卡片 */}      
      <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-out ${showSummary ? 'translate-y-0' : 'translate-y-full'}`}>      
        <div className="w-full max-w-md mx-auto bg-white rounded-t-[32px] p-7 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100 relative overflow-hidden">      
                
          {/* 顶部拖拽条 */}  
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>      
  
          {/* 👇 新增：右上角关闭按钮 👇 */}  
          <button   
            onClick={() => setShowSummary(false)}  
            className="absolute top-6 right-6 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-50 group"  
          >  
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-[2.5] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">  
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />  
            </svg>  
          </button>  
            
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B6CE0] opacity-[0.03] rounded-bl-full pointer-events-none"></div>      
      
          {/* 👇 修改点：这里加了 pr-8 防止长标题跟关闭按钮挤在一起 👇 */}  
          <div className="relative z-10 pr-8">      
            <h2 className="text-sm font-bold text-gray-400 mb-1">今日热量结算 (kcal)</h2>      
            <div className="flex items-end justify-between mb-3">      
              <div className="text-6xl font-black text-[#8B6CE0] tracking-tight leading-none">      
                {currentDeficit > 0 ? `+${currentDeficit}` : currentDeficit}      
              </div>      
              <div className="text-sm font-bold text-gray-400 mb-1">      
                目标: {summaryData.targetDeficit}      
              </div>      
            </div>      
                  
            <div className="inline-flex items-center gap-1.5 bg-[#F4F1FD] px-3 py-1.5 rounded-lg">      
              <span className="text-sm">✨</span>      
              <span className="text-xs font-bold text-[#8B6CE0]">      
                {currentDeficit <= 0 ? "热量缺口，正在掉秤中！" : "今天吃得有点多哦，明天加油！"}      
              </span>      
            </div>      
          </div>      
      
          <div className="mt-8 bg-[#F9F9FB] rounded-[24px] p-5 border border-gray-100/50">      
            <div className="flex items-center justify-between py-2 group cursor-default">      
              <div className="flex items-center gap-3">      
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">      
                  🍽️      
                </div>      
                <span className="font-bold text-gray-700 text-sm">饮食总摄入</span>      
              </div>      
              <span className="font-black text-[#3CA873] text-lg tracking-wide">+{summaryData.intake}</span>      
            </div>      
      
            <div className="w-full h-px bg-gray-200/60 my-2"></div>      
      
            <div className="flex items-center justify-between py-2 group cursor-default">      
              <div className="flex items-center gap-3">      
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">      
                  🔥      
                </div>      
                <span className="font-bold text-gray-700 text-sm">基础代谢 (BMR)</span>      
              </div>      
              <span className="font-black text-[#F4C745] text-lg tracking-wide">-{summaryData.bmr}</span>      
            </div>      
      
            <div className="w-full h-px bg-gray-200/60 my-2"></div>      
      
            <div className="flex items-center justify-between py-2 group cursor-default">      
              <div className="flex items-center gap-3">      
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">      
                  🏃      
                </div>      
                <span className="font-bold text-gray-700 text-sm">运动消耗</span>      
              </div>      
              <span className="font-black text-[#8B6CE0] text-lg tracking-wide">-{summaryData.exercise}</span>      
            </div>      
          </div>      
                
          <Link       
            href="/diary"      
            className="w-full mt-6 text-[#8B6CE0] font-bold py-4 rounded-2xl transition-all duration-300 bg-[#F4F1FD] hover:bg-[#EAE4FB] text-sm tracking-wide active:scale-95 flex justify-center items-center"      
          >      
            去日记查看详情明细 →      
          </Link>      
      
        </div>      
      </div>      
      
    </div>                
  );                
}    
