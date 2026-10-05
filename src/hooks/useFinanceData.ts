import { useEffect, useState } from 'react';
import { defaultData } from '../data/defaultData';
import type { FinanceData } from '../types/finance';
const KEY='mijn-geld-data';
export function useFinanceData(){
 const [data,setData]=useState<FinanceData>(()=>{try{const saved=localStorage.getItem(KEY);return saved?JSON.parse(saved):defaultData}catch{return defaultData}});
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(data)),[data]);
 const reset=()=>{localStorage.removeItem(KEY);setData(defaultData)};
 return {data,setData,reset};
}
