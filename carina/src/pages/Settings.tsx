import { useEffect, useRef, useState } from 'react';
import { db } from '@/database/db';
import { uid } from '@/utils/id';
import { exportBackup, importBackup } from '@/services/backup';
import type { Account, Category, Person } from '@/models';

export function Settings() {
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [people,setPeople]=useState<Person[]>([]);
  const fileRef=useRef<HTMLInputElement>(null);

  async function refresh(){
    setAccounts(await db.accounts.filter(x=>!x.isArchived).sortBy('sortOrder'));
    setCategories(await db.categories.filter(x=>!x.isArchived).sortBy('sortOrder'));
    setPeople(await db.people.filter(x=>!x.isArchived).sortBy('sortOrder'));
  }
  useEffect(()=>{refresh()},[]);

  async function addAccount(){
    const name=prompt('账户名称');
    if(name?.trim()) {
      await db.accounts.add({id:uid(),name:name.trim(),currency:'CNY',kind:'other',openingBalance:0,includeInNetWorth:true,sortOrder:Date.now(),isArchived:false});
      refresh();
    }
  }
  async function addCategory(){
    const name=prompt('支出分类名称');
    if(name?.trim()) {
      await db.categories.add({id:uid(),name:name.trim(),flow:'expense',sortOrder:Date.now(),isArchived:false});
      refresh();
    }
  }
  async function addPerson(){
    const name=prompt('人物名称');
    if(name?.trim()) {
      await db.people.add({id:uid(),name:name.trim(),isArchived:false,sortOrder:Date.now()});
      refresh();
    }
  }
  async function backup(){
    const blob=new Blob([await exportBackup()],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`carina-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function restore(file:File){
    await importBackup(await file.text());
    await refresh();
    alert('恢复完成');
  }

  return <section>
    <header className="topbar"><h1>设置</h1></header>
    <div className="settings-group"><h2>账户</h2>
      {accounts.map(x=><div className="row" key={x.id}>{x.name}<span>{x.currency}</span></div>)}
      <button className="secondary" onClick={addAccount}>＋ 添加账户</button>
    </div>
    <div className="settings-group"><h2>分类</h2>
      {categories.map(x=><div className="row" key={x.id}>{x.name}<span>{x.flow==='expense'?'支出':'收入'}</span></div>)}
      <button className="secondary" onClick={addCategory}>＋ 添加分类</button>
    </div>
    <div className="settings-group"><h2>人物</h2>
      {people.map(x=><div className="row" key={x.id}>{x.name}</div>)}
      <button className="secondary" onClick={addPerson}>＋ 添加人物</button>
    </div>
    <div className="settings-group">
      <h2>数据</h2>
      <button className="secondary" onClick={backup}>导出备份</button>
      <button className="secondary" onClick={()=>fileRef.current?.click()}>恢复备份</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)restore(f).catch(err=>alert(err.message))}}/>
    </div>
  </section>;
}
