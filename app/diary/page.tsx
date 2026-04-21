"use client";  
  
import React, { useState, useEffect, useMemo } from "react";  
import Link from "next/link";  
  
// 餐段配置  
const MEAL_TYPES = {  
  breakfast: { id: 'breakfast', icon: '🍳', name: '早餐', order: 1 },  
  lunch: { id: 'lunch', icon: '🍱', name: '中餐', order: 2 },  
  dinner: { id: 'dinner', icon: '🥗', name: '晚餐', order: 3 },  
  snack: { id: 'snack', icon: '🍎', name: '加餐', order: 4 },  
  midnight: { id: 'midnight', icon: '🍜', name: '夜宵', order: 5 }  
};  
  
const generateDateStr = (d: Date) => {  
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;  
};  
  
// SVG 环形图组件  
const RingChart = ({ value, max, label, subLabel, colorCode }: { value: number, max: number, label: string, subLabel: string, colorCode: string }) => {  
  const radius = 45;  
  const circumference = 2 * Math.PI * radius;  
  // 避免 max 为 0 时计算出错  
  const safeMax = max > 0 ? max : 1;  
  const percent = Math.min(Math.max(value / safeMax, 0), 1);  
  const dashoffset = circumference - percent * circumference;  
  
  return (  
    <div className="flex flex-col items-center justify-center relative w-32 h-32">  
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">  
        {/* 背景环 */}  
        <circle cx="64" cy="64" r={radius} stroke="#F3F4F6" strokeWidth="10" fill="none" />  
        {/* 进度环 */}  
        <circle   
          cx="64" cy="64" r={radius}   
          stroke={colorCode} strokeWidth="10" fill="none"   
          strokeDasharray={circumference}   
          strokeDashoffset={dashoffset}   
          strokeLinecap="round"  
          className="transition-all duration-1000 ease-out"  
        />  
      </svg>  
      <div className="relative z-10 text-center flex flex-col items-center justify-center mt-1">  
        <span className="text-2xl font-black text-gray-800 leading-none">{value}</span>  
        <span className="text-[10px] text-gray-500 font-medium mt-1">{subLabel}</span>  
      </div>  
    </div>  
  );  
};  
  
export default function DiaryPage() {  
  const [currentDate, setCurrentDate] = useState(new Date());  
  const [bmrTarget, setBmrTarget] = useState(1350); // 默认 1350，稍后会从接口拉取  
  const [currentFoods, setCurrentFoods] = useState<any[]>([]);  
    
  const [isInputting, setIsInputting] = useState(false);  
  const [isSaving, setIsSaving] = useState(false);  
  const [newFood, setNewFood] = useState({ name: "", calories: "", mealType: "lunch", emoji: "🍽️" });  
  
  const dateStr = generateDateStr(currentDate);  
  
  // 1. 页面加载时，获取全局设置中的 BMR 目标  
  useEffect(() => {  
    const fetchSettings = async () => {  
      try {  
        const res = await fetch("/api/settings");  
        const json = await res.json();  
        if (json.success && json.data.bmr) {  
          setBmrTarget(json.data.bmr); // 确保与统计看板同步  
        }  
      } catch (err) {  
        console.error("无法拉取 BMR 设置", err);  
      }  
    };  
    fetchSettings();  
  }, []);  
  
  // 2. 每次日期切换时，拉取对应日期的食物记录  
  useEffect(() => {  
    const fetchFoods = async () => {  
      try {  
        const res = await fetch(`/api/food?date=${dateStr}&t=${Date.now()}`);  
        const json = await res.json();  
        if (json.success) {  
          setCurrentFoods(json.data || []);  
        } else {  
          setCurrentFoods([]);  
        }  
      } catch (err) {  
        console.error("加载数据失败:", err);  
        setCurrentFoods([]);  
      }  
    };  
    fetchFoods();  
  }, [dateStr]);  
  
  // 计算热量  
  const totalIntake = currentFoods.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);  
  const remaining = bmrTarget - totalIntake;  
  const isExceeded = remaining < 0;  
  
  // 按餐段分组数据  
  const groupedFoods = useMemo(() => {  
    const groups: Record<string, any> = {};  
    currentFoods.forEach(food => {  
      const typeKey = food.mealType || 'lunch';  
      if (!groups[typeKey]) {  
        groups[typeKey] = {  
          info: MEAL_TYPES[typeKey as keyof typeof MEAL_TYPES] || MEAL_TYPES.lunch,  
          items: [],  
          total: 0  
        };  
      }  
      groups[typeKey].items.push(food);  
      groups[typeKey].total += Number(food.calories) || 0;  
    });  
    // 按设定的顺序排序 (早餐 -> 中餐 -> 晚餐 ...)  
    return Object.values(groups).sort((a, b) => a.info.order - b.info.order);  
  }, [currentFoods]);  
  
  // 日期显示逻辑  
  const getDisplayText = (d: Date) => {  
    const today = new Date();  
    if (d.toDateString() === today.toDateString()) return "今天";  
    const yest = new Date(today);  
    yest.setDate(yest.getDate() - 1);  
    if (d.toDateString() === yest.toDateString()) return "昨天";  
    return `${d.getMonth() + 1}月${d.getDate()}日`;  
  };  
  
  const handlePrevDay = () => {  
    const d = new Date(currentDate);  
    d.setDate(d.getDate() - 1);  
    setCurrentDate(d);  
  };  
  
  const handleNextDay = () => {  
    const d = new Date(currentDate);  
    d.setDate(d.getDate() + 1);  
    if (d <= new Date()) setCurrentDate(d);  
  };  
  
  // 保存手动输入的食物到后端  
  const handleSaveFood = async () => {  
    if (!newFood.name || !newFood.calories) return;  
    setIsSaving(true);  
      
    try {  
      const response = await fetch("/api/food", {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({   
          date: dateStr,  
          food: {         
            name: newFood.name,         
            calories: Number(newFood.calories),        
            mealType: newFood.mealType,  
            emoji: newFood.emoji,  
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })  
          }  
        })         
      });  
        
      const json = await response.json();  
      if (json.success) {  
        // 重新拉取当日数据刷新列表  
        const res = await fetch(`/api/food?date=${dateStr}&t=${Date.now()}`);  
        const newJson = await res.json();  
        if (newJson.success) setCurrentFoods(newJson.data || []);  
          
        setIsInputting(false);  
        setNewFood({ name: "", calories: "", mealType: "lunch", emoji: "🍽️" });  
      } else {  
        alert("保存失败了");  
      }  
    } catch (err) {  
      alert("网络出小差了，请重试");  
    } finally {  
      setIsSaving(false);  
    }  
  };  
  
  return (  
    <div className="max-w-md mx-auto min-h-screen pb-20 relative overflow-hidden flex flex-col bg-[#F7F8FA]">  
        
      {/* 顶部导航与日期切换 */}  
      <div className="px-6 pt-8 pb-4">  
        <div className="flex justify-between items-center mb-6">  
          <div className="flex items-center gap-3">  
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition font-bold text-lg">  
              ←  
            </Link>  
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">饮食日记</h1>  
          </div>  
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">  
            <button onClick={handlePrevDay} className="text-gray-400 hover:text-gray-800 font-bold px-2">◀</button>  
            <span className="font-bold text-sm text-gray-800 min-w-[36px] text-center">{getDisplayText(currentDate)}</span>  
            <button   
              onClick={handleNextDay}   
              disabled={currentDate.toDateString() === new Date().toDateString()}  
              className="text-gray-400 hover:text-gray-800 font-bold px-2 disabled:opacity-20"  
            >▶</button>  
          </div>  
        </div>  
      </div>  
  
      {/* 双环形图卡片 */}  
      <div className="px-6 mb-6">  
        <div className="bg-white rounded-[32px] p-6 shadow-sm flex justify-around items-center border border-gray-50">  
          <RingChart   
            value={totalIntake}   
            max={bmrTarget}   
            label="已摄入"   
            subLabel="已摄入 kcal"   
            colorCode="#F4C745" // 主题黄  
          />  
            
          <div className="w-px h-16 bg-gray-100"></div>  
  
          <RingChart   
            value={isExceeded ? Math.abs(remaining) : remaining}   
            max={bmrTarget}   
            label={isExceeded ? "已超标" : "还可以吃"}   
            subLabel={isExceeded ? "已超标 kcal" : "还可以吃 kcal"}   
            colorCode={isExceeded ? "#EF4444" : "#10B981"} // 红色 or 绿色  
          />  
        </div>  
      </div>  
  
      {/* 分组食物列表 */}  
      <div className="px-6 flex-1 space-y-5">  
        {groupedFoods.length === 0 ? (  
          <div className="text-center py-10 opacity-50">  
            <p className="text-4xl mb-2">🍽️</p>  
            <p className="text-sm font-bold text-gray-500">这一天还没有记录食物哦</p>  
          </div>  
        ) : (  
          groupedFoods.map((group, idx) => (  
            <div key={idx} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-50 animate-fade-in">  
              {/* 组表头 (复刻截图的黄色条) */}  
              <div className="bg-[#F4C745] px-5 py-3 flex justify-between items-center text-white">  
                <div className="flex items-center gap-2">  
                  <span className="text-lg bg-white/20 rounded-full w-7 h-7 flex items-center justify-center">{group.info.icon}</span>  
                  <span className="font-bold tracking-wide">{group.info.name}</span>  
                </div>  
                <span className="font-medium text-sm">共摄入 {group.total} kcal</span>  
              </div>  
                
              {/* 组内食物列表 */}  
              <div className="px-5">  
                {group.items.map((item: any, index: number) => (  
                  <div key={item.id || index} className={`flex items-center justify-between py-4 ${index !== group.items.length - 1 ? 'border-b border-gray-100' : ''}`}>  
                    <div className="flex items-center gap-4">  
                      {/* 图标/图片展示区域 */}  
                      <div className="w-14 h-14 bg-[#F4F6F8] rounded-[16px] flex items-center justify-center text-2xl shadow-inner overflow-hidden">  
                        {item.imageUrl ? (  
                           <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />  
                        ) : (  
                           <span>{item.emoji || "🍽️"}</span>  
                        )}  
                      </div>  
                      <div>  
                        <h4 className="font-bold text-gray-800 text-base mb-0.5">{item.name}</h4>  
                        <p className="text-xs text-gray-400 font-medium">  
                          {item.time || "刚刚"} 记录  
                        </p>  
                      </div>  
                    </div>  
                    <div className="text-right">  
                      <p className="font-bold text-[#2E8B57] text-lg">{item.calories} kcal</p>  
                    </div>  
                  </div>  
                ))}  
              </div>  
            </div>  
          ))  
        )}  
  
        {/* 手动输入模块 */}  
        {isInputting ? (  
          <div className="mt-6 bg-white p-5 rounded-[24px] shadow-lg border border-gray-100 animate-fade-in">  
            <h4 className="font-bold text-gray-800 mb-4 text-sm">手动添加新食物</h4>  
              
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>  
              {Object.values(MEAL_TYPES).map((m) => (  
                <button   
                  key={m.id}  
                  onClick={() => setNewFood({...newFood, mealType: m.id})}  
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${  
                    newFood.mealType === m.id   
                    ? 'bg-[#F4C745] text-white border-[#F4C745] shadow-md'   
                    : 'bg-gray-50 text-gray-500 border-gray-200'  
                  }`}  
                >  
                  {m.icon} {m.name}  
                </button>  
              ))}  
            </div>  
  
            <div className="flex gap-2 mb-3">  
              <input   
                type="text" placeholder="食物 Emoji" maxLength={2}  
                className="w-16 bg-gray-50 p-3.5 rounded-xl text-center outline-none text-xl focus:ring-2 focus:ring-[#F4C745] transition-all border border-transparent"  
                value={newFood.emoji} onChange={e => setNewFood({...newFood, emoji: e.target.value})}  
              />  
              <input   
                type="text" placeholder="食物名称 (如: 牛肉面)"   
                className="flex-1 bg-gray-50 p-3.5 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#F4C745] transition-all border border-transparent"  
                value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})}  
              />  
            </div>  
              
            <div className="relative mb-5">  
              <input   
                type="number" placeholder="热量值"   
                className="w-full bg-gray-50 p-3.5 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#F4C745] transition-all border border-transparent"  
                value={newFood.calories} onChange={e => setNewFood({...newFood, calories: e.target.value})}  
              />  
              <span className="absolute right-4 top-3.5 text-sm font-bold text-gray-400">kcal</span>  
            </div>  
              
            <div className="flex gap-3">  
              <button onClick={() => setIsInputting(false)} className="flex-1 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">取消</button>  
              <button   
                onClick={handleSaveFood}   
                disabled={isSaving}  
                className="flex-1 py-3.5 text-sm font-bold text-white bg-[#F4C745] hover:bg-yellow-500 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"  
              >  
                {isSaving ? "保存中..." : "保存记录"}  
              </button>  
            </div>  
          </div>  
        ) : (  
          <button   
            onClick={() => setIsInputting(true)}  
            className="w-full mt-4 py-4 bg-white text-gray-500 font-bold rounded-[24px] border-2 border-dashed border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"  
          >  
            <span className="text-xl">+</span> 添加手动记录  
          </button>  
        )}  
      </div>  
    </div>  
  );  
}  
