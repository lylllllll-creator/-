"use client";    
    
import React, { useState, useEffect } from "react";    
import Link from "next/link";    
// 引入 Recharts 图表库    
import {    
  ComposedChart,    
  Line,    
  Bar,    
  XAxis,    
  YAxis,    
  CartesianGrid,    
  Tooltip,    
  ResponsiveContainer,    
} from "recharts";    
    
export default function StatisticsPage() {    
  const [activeTab, setActiveTab] = useState("overview");    
  const [isSyncing, setIsSyncing] = useState(false);    
      
  // 核心健康数据状态    
  const [currentBmr, setCurrentBmr] = useState(1350);    
  const [currentWeight, setCurrentWeight] = useState(66.8);    
  const [activeEnergy, setActiveEnergy] = useState(0); // 运动消耗    
      
  // 饮食摄入：在实际项目中应该从日记里算，这里为了演示我们临时存一个状态    
  const [intake, setIntake] = useState(1850);     
      
  // 历史数据数组 (用于图表)    
  const [historyData, setHistoryData] = useState<any[]>([]);    
    
  // 弹窗状态    
  const [showWeightModal, setShowWeightModal] = useState(false);    
  const [showBmrModal, setShowBmrModal] = useState(false);    
  const [tempWeight, setTempWeight] = useState("");    
  const [tempBmr, setTempBmr] = useState("");    
    
  // 页面加载时拉取全局设置(BMR)和历史数据    
  useEffect(() => {    
    const fetchSettings = async () => {    
      try {    
        const res = await fetch("/api/settings");    
        const json = await res.json();    
        if (json.success && json.data.bmr) {    
          setCurrentBmr(json.data.bmr);    
        }    
      } catch (err) {}    
    };    
    fetchSettings();    
    fetchHistoryData();    
  }, []);    
    
  const fetchHistoryData = async () => {    
    try {    
      const res = await fetch(`/api/save-daily?t=${Date.now()}`);    
      const json = await res.json();    
      if (json.success && json.data.length > 0) {    
        setHistoryData(json.data);    
        // 把最后一天的数据同步到当前状态    
        const lastRecord = json.data[json.data.length - 1];    
        setCurrentWeight(lastRecord.weight || 66.8);    
        // 注意：这里的BMR如果不更新，以全局设置的优先    
        if (!currentBmr && lastRecord.bmr) {    
            setCurrentBmr(lastRecord.bmr);    
        }    
        setActiveEnergy(lastRecord.active || 0);    
        setIntake(lastRecord.intake || 1850);    
      }    
    } catch (err) {    
      console.error("加载数据失败:", err);    
    }    
  };    
    
  // 模拟保存一天的数据到后端    
  const saveTodayData = async (newData: any) => {    
    const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });    
    try {    
      await fetch("/api/save-daily", {    
        method: "POST",    
        headers: { "Content-Type": "application/json" },    
        body: JSON.stringify({    
          date: todayStr,    
          weight: newData.weight ?? currentWeight,    
          intake: newData.intake ?? intake,    
          bmr: newData.bmr ?? currentBmr,    
          active: newData.active ?? activeEnergy    
        })    
      });    
      fetchHistoryData(); // 重新拉取刷新图表    
    } catch (err) {    
      console.error("保存失败:", err);    
    }    
  };    
    
  // 模拟同步苹果健康    
  const handleSyncHealth = () => {    
    setIsSyncing(true);    
    setTimeout(() => {    
      const mockEnergy = Math.floor(Math.random() * 300) + 200; // 模拟产生 200-500 之间的消耗    
      setActiveEnergy(mockEnergy);    
      saveTodayData({ active: mockEnergy });    
      setIsSyncing(false);    
    }, 1500);    
  };    
    
  // 保存体重    
  const handleSaveWeight = () => {    
    const num = Number(tempWeight);    
    if (num > 20 && num < 200) {    
      setCurrentWeight(num);    
      saveTodayData({ weight: num });    
    }    
    setShowWeightModal(false);    
  };    
    
  // 保存 BMR 到全局设置    
  const handleSaveBmr = async () => {    
    const num = Number(tempBmr);    
    if (num > 500 && num < 4000) {    
      setCurrentBmr(num);    
      await fetch("/api/settings", {    
        method: "POST",    
        headers: { "Content-Type": "application/json" },    
        body: JSON.stringify({ bmr: num })    
      });    
      saveTodayData({ bmr: num });    
    }    
    setShowBmrModal(false);    
  };    
    
  // 计算净热量 (负数表示消耗大于摄入，即在变瘦)    
  const netCalories = intake - (currentBmr + activeEnergy);    
      
  // 自定义图表 Tooltip    
  const CustomTooltip = ({ active, payload, label }: any) => {    
    if (active && payload && payload.length) {    
      return (    
        <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-gray-100 text-sm">    
          <p className="font-bold text-gray-800 mb-2">{label}</p>    
          <p className="text-[#8B6CE0] flex justify-between gap-4">    
            <span>体重:</span>     
            <span className="font-bold">{payload[1]?.value} kg</span>    
          </p>    
          <p className="text-[#F4C745] flex justify-between gap-4">    
            <span>摄入:</span>     
            <span className="font-bold">{payload[0]?.value} kcal</span>    
          </p>    
        </div>    
      );    
    }    
    return null;    
  };    
    
  return (    
    <div className="min-h-screen bg-[#F7F8FA] pb-20 font-sans">    
        
      {/* 顶部标签切换 */}    
      <div className="bg-white px-6 pt-6 pb-4 shadow-sm sticky top-0 z-10 rounded-b-3xl border-b border-gray-50">    
        <div className="flex justify-between items-center mb-4">    
          <h1 className="text-2xl font-bold text-gray-800">综合健康数据</h1>    
          <Link href="/" className="text-sm px-4 py-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 font-medium">    
            返回    
          </Link>    
        </div>    
        <div className="flex bg-[#F7F8FA] p-1 rounded-2xl">    
          <button     
            onClick={() => setActiveTab('overview')}    
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}    
          >    
            今日总览    
          </button>    
          <button     
            onClick={() => setActiveTab('trends')}    
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'trends' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}    
          >    
            体重与趋势    
          </button>    
        </div>    
      </div>    
    
      <div className="max-w-md mx-auto pt-4">    
          
        {/* === 今日总览 Tab === */}    
        {activeTab === 'overview' && (    
          <div className="px-6 space-y-5">    
                
            {/* Apple Health 同步卡片 (新版样式) */}    
            <div className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm border border-gray-50">  
              <div className="flex items-center gap-4">  
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center border-4 border-pink-100/50 relative">  
                  <span className="text-xl relative z-10">❤️</span>  
                  {isSyncing && <div className="absolute inset-0 border-4 border-pink-400 rounded-full border-t-transparent animate-spin"></div>}  
                </div>  
                <div>  
                  <h3 className="font-bold text-gray-800 text-[15px]">Apple Health</h3>  
                  <p className="text-xs text-gray-400 mt-0.5">{activeEnergy > 0 ? '刚刚已同步' : '等待同步今日运动'}</p>  
                </div>  
              </div>  
              <button   
                onClick={handleSyncHealth}  
                disabled={isSyncing}  
                className="bg-[#E85D96] hover:bg-[#D64882] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-pink-200 disabled:opacity-50 disabled:shadow-none"  
              >  
                {isSyncing ? '同步中...' : (activeEnergy > 0 ? '重新同步' : '点击同步')}  
              </button>  
            </div>   
    
            {/* 白底呼吸感 - 今日热量结算卡片 (替换旧紫底) */}    
            <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-50 relative overflow-hidden transition-all hover:shadow-md">  
              {/* 右上角背景光晕点缀 */}  
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B6CE0] opacity-[0.03] rounded-bl-full pointer-events-none"></div>  
  
              {/* 卡片头部 */}  
              <div className="relative z-10">  
                <h2 className="text-sm font-bold text-gray-400 mb-1">今日热量结算 (kcal)</h2>  
                <div className="flex items-end justify-between mb-3">  
                  <div className="text-6xl font-black text-[#8B6CE0] tracking-tight leading-none">  
                    {netCalories > 0 ? `+${netCalories}` : netCalories}  
                  </div>  
                  <div className="text-sm font-bold text-gray-400 mb-1">  
                    目标: -300  
                  </div>  
                </div>  
                  
                <div className="inline-flex items-center gap-1.5 bg-[#F4F1FD] px-3 py-1.5 rounded-lg">  
                  <span className="text-sm">✨</span>  
                  <span className="text-xs font-bold text-[#8B6CE0]">  
                    {netCalories <= 0 ? "热量缺口，正在掉秤中！" : "今天吃得有点多哦，明天加油！"}  
                  </span>  
                </div>  
              </div>  
  
              {/* 数据明细区域 */}  
              <div className="mt-8 bg-[#F9F9FB] rounded-[24px] p-5 border border-gray-100/50">  
                <div className="flex items-center justify-between py-2 group cursor-default">  
                  <div className="flex items-center gap-3">  
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">🍽️</div>  
                    <span className="font-bold text-gray-700 text-sm">饮食总摄入</span>  
                  </div>  
                  <span className="font-black text-[#3CA873] text-lg tracking-wide">+{intake}</span>  
                </div>  
  
                <div className="w-full h-px bg-gray-200/60 my-2"></div>  
  
                <div className="flex items-center justify-between py-2 group cursor-default">  
                  <div className="flex items-center gap-3">  
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">🔥</div>  
                    <span className="font-bold text-gray-700 text-sm">基础代谢 (BMR)</span>  
                  </div>  
                  <span className="font-black text-[#F4C745] text-lg tracking-wide">-{currentBmr}</span>  
                </div>  
  
                <div className="w-full h-px bg-gray-200/60 my-2"></div>  
  
                <div className="flex items-center justify-between py-2 group cursor-default">  
                  <div className="flex items-center gap-3">  
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm border border-gray-50 group-hover:scale-110 transition-transform">🏃</div>  
                    <span className="font-bold text-gray-700 text-sm">运动消耗</span>  
                  </div>  
                  <span className="font-black text-[#8B6CE0] text-lg tracking-wide">-{activeEnergy}</span>  
                </div>  
              </div>  
            </div>   
                
            {/* BMR 设置按钮 (新版样式) */}  
            <button   
              onClick={() => { setTempBmr(currentBmr.toString()); setShowBmrModal(true); }}  
              className="w-full bg-white rounded-[20px] p-4 flex items-center justify-center gap-2 shadow-sm border border-gray-50 transition-colors hover:bg-gray-50 active:scale-95"  
            >  
              <span className="text-lg">⚙️</span>  
              <span className="font-bold text-[#8B6CE0] text-[15px]">设置我的基础代谢 (BMR)</span>  
            </button>  
    
          </div>    
        )}    
    
        {/* === 体重与趋势 Tab (保留图表功能) === */}    
        {activeTab === 'trends' && (    
          <div className="px-6 space-y-5">    
                
            {/* 体重记录卡片 */}    
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50">    
              <div className="flex justify-between items-center">    
                <div>    
                  <p className="text-xs font-bold text-gray-400 mb-1">当前体重</p>    
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{currentWeight.toFixed(1)} <span className="text-base text-gray-400 font-bold">kg</span></h2>    
                </div>    
                <button     
                  onClick={() => { setTempWeight(currentWeight.toString()); setShowWeightModal(true); }}    
                  className="bg-[#F4F1FD] hover:bg-[#EAE4FB] text-[#8B6CE0] font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"    
                >    
                  + 记录今天体重    
                </button>    
              </div>    
            </div>    
    
            {/* Recharts 双轴混合图表 */}    
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">    
              <h3 className="font-bold text-gray-800 mb-6 px-2">近7天摄入与体重趋势</h3>    
                  
              <div className="h-64 w-full -ml-2">    
                <ResponsiveContainer width="100%" height="100%">    
                  <ComposedChart data={historyData}>    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />    
                        
                    <XAxis     
                      dataKey="date"     
                      axisLine={false}     
                      tickLine={false}     
                      tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}     
                      dy={10}    
                    />    
                        
                    <YAxis     
                      yAxisId="left"     
                      orientation="left"     
                      hide={true}     
                      domain={[0, 3000]}    
                    />    
                        
                    <YAxis     
                      yAxisId="right"     
                      orientation="right"     
                      axisLine={false}     
                      tickLine={false}     
                      tick={{ fontSize: 10, fill: '#8B6CE0', fontWeight: 600 }}    
                      domain={['dataMin - 1', 'dataMax + 1']}    
                      dx={5}    
                    />    
                        
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />    
                        
                    <Bar     
                      yAxisId="left"     
                      dataKey="intake"     
                      fill="#F4C745"     
                      radius={[6, 6, 0, 0]}     
                      barSize={12}    
                      opacity={0.6}  
                    />    
                        
                    <Line     
                      yAxisId="right"     
                      type="monotone"     
                      dataKey="weight"     
                      stroke="#8B6CE0"     
                      strokeWidth={3}    
                      dot={{ r: 4, fill: '#fff', stroke: '#8B6CE0', strokeWidth: 2 }}    
                      activeDot={{ r: 6, fill: '#8B6CE0', stroke: '#fff', strokeWidth: 2 }}    
                    />    
                  </ComposedChart>    
                </ResponsiveContainer>    
              </div>    
    
              {/* 图例 */}    
              <div className="flex justify-center gap-6 mt-6">    
                <div className="flex items-center gap-2">    
                  <div className="w-3 h-3 rounded-full bg-[#8B6CE0]"></div>    
                  <span className="text-xs text-gray-500 font-bold">体重 (kg)</span>    
                </div>    
                <div className="flex items-center gap-2">    
                  <div className="w-3 h-3 rounded bg-[#F4C745] opacity-60"></div>    
                  <span className="text-xs text-gray-500 font-bold">摄入 (kcal)</span>    
                </div>    
              </div>    
            </div>    
    
          </div>    
        )}    
      </div>    
    
      {/* 体重录入弹窗 */}    
      {showWeightModal && (    
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">    
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-fade-in border border-gray-50">    
            <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">今天体重是多少？</h3>    
            <div className="flex items-end justify-center gap-2 mb-8">    
              <input     
                type="number"     
                value={tempWeight}    
                onChange={(e) => setTempWeight(e.target.value)}    
                className="w-24 text-4xl font-black text-center text-[#8B6CE0] border-b-2 border-gray-100 focus:border-[#8B6CE0] focus:outline-none bg-transparent pb-1"    
                autoFocus    
              />    
              <span className="text-gray-400 font-bold pb-2">kg</span>    
            </div>    
            <div className="flex gap-3">    
              <button     
                onClick={() => setShowWeightModal(false)}    
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"    
              >    
                取消    
              </button>    
              <button     
                onClick={handleSaveWeight}    
                className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#8B6CE0] hover:bg-[#795ACA] shadow-sm transition-colors"    
              >    
                保存    
              </button>    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* 基础代谢录入弹窗 */}    
      {showBmrModal && (    
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">    
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-fade-in border border-gray-50">    
            <h3 className="font-bold text-gray-800 mb-2 text-center text-lg">设置基础代谢 (BMR)</h3>    
            <p className="text-xs text-gray-400 text-center mb-6 font-medium">人一天躺着不动消耗的热量</p>    
            <div className="flex items-end justify-center gap-2 mb-8">    
              <input     
                type="number"     
                value={tempBmr}    
                onChange={(e) => setTempBmr(e.target.value)}    
                className="w-28 text-4xl font-black text-center text-[#F4C745] border-b-2 border-gray-100 focus:border-[#F4C745] focus:outline-none bg-transparent pb-1"    
                autoFocus    
              />    
              <span className="text-gray-400 font-bold pb-2">kcal</span>    
            </div>    
            <div className="flex gap-3">    
              <button     
                onClick={() => setShowBmrModal(false)}    
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"    
              >    
                取消    
              </button>    
              <button     
                onClick={handleSaveBmr}    
                className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#F4C745] hover:bg-[#E3B634] shadow-sm transition-colors"    
              >    
                保存    
              </button>    
            </div>    
          </div>    
        </div>    
      )}    
    
    </div>    
  );    
}    
