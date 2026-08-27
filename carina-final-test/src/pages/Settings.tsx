import { useEffect, useRef, useState } from 'react';
import { Database, Download, Plus, Upload, Users, Tags, Wallet } from 'lucide-react';
import { db } from '@/database/db';
import { uid } from '@/utils/id';
import { exportBackup, importBackup } from '@/services/backup';
import { getAccountBalance } from '@/services/balance';
import type { Account, Category, Person } from '@/models';

export function Settings() {
  const [accounts,setAccounts]=useState<(Account & { balance:number })[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [people,setPeople]=useState<Person[]>([]);
  const fileRef=useRef<HTMLInputElement>(null);

  async function refresh(){
    const active = await db.accounts.filter(x=>!x.isArchived).sortBy('sortOrder');
    setAccounts(await Promise.all(active.map(async x => ({ ...x, balance: await getAccountBalance(x) }))));
    setCategories(await db.categories.filter(x=>!x.isArchived).sortBy('sortOrder'));
    setPeople(await db.people.filter(x=>!x.isArchived).sortBy('sortOrder'));
  }
  useEffect(()=>{refresh()},[]);

  async function addAccount(){
    const name=prompt('Account name');
    if(!name?.trim()) return;

    const opening=prompt('Opening balance (optional)','0');
    const openingBalance=opening?.trim() ? Number(opening) : 0;
    if(!Number.isFinite(openingBalance)){
      alert('Opening balance must be a number.');
      return;
    }

    const includeInNetWorth=confirm(
      'Include this account in net assets?\n\nOK = include in net assets\nCancel = spending-only account (e.g. credit card)'
    );

    const kindInput=prompt(
      'Account type: card / bank / cash / wallet / other',
      'other'
    );
    const kind=(kindInput?.trim() || 'other') as Account['kind'];

    await db.accounts.add({
      id:uid(),
      name:name.trim(),
      currency:'CNY',
      kind,
      openingBalance,
      includeInNetWorth,
      sortOrder:Date.now(),
      isArchived:false
    });

    await refresh();
  }

  async function editOpeningBalance(account: Account & { balance:number }){
    const value=prompt(
      `Opening balance for ${account.name}`,
      String(account.openingBalance)
    );
    if(value===null) return;

    const openingBalance=Number(value);
    if(!Number.isFinite(openingBalance)){
      alert('Opening balance must be a number.');
      return;
    }

    await db.accounts.update(account.id,{openingBalance});
    await refresh();
  }

  async function editAccount(account: Account & { balance:number }){
    const name=prompt('Account name',account.name);
    if(name===null || !name.trim()) return;

    const includeInNetWorth=confirm(
      `Include "${name.trim()}" in net assets?\n\nOK = yes\nCancel = spending-only account`
    );

    const kindInput=prompt(
      'Account type: card / bank / cash / wallet / other',
      account.kind || 'other'
    );
    const kind=kindInput?.trim() || account.kind || 'other';

    await db.accounts.update(account.id,{
      name:name.trim(),
        kind: kind as Account['kind'],
      includeInNetWorth
    });

    await refresh();
  }

  async function deleteAccount(account: Account){
    const confirmed=confirm(
      `Delete account "${account.name}"?\n\nHistorical transactions will NOT be deleted.`
    );
    if(!confirmed) return;

    await db.accounts.update(account.id,{isArchived:true});
    await refresh();
  }
  async function addCategory(){
    const name=prompt('Expense category name');
    if(name?.trim()) { await db.categories.add({id:uid(),name:name.trim(),flow:'expense',sortOrder:Date.now(),isArchived:false}); refresh(); }
  }
  async function addPerson(){
    const name=prompt('Person name');
    if(name?.trim()) { await db.people.add({id:uid(),name:name.trim(),isArchived:false,sortOrder:Date.now()}); refresh(); }
  }
  async function backup(){
    const blob=new Blob([await exportBackup()],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`carina-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function restore(file:File){ await importBackup(await file.text()); await refresh(); if(fileRef.current) fileRef.current.value=''; alert('Restore complete'); }

  return <section>
    <header className="hero-head inner-head">
      <div><div className="script-title">Atelier</div><div className="brand-subtitle">YOUR PRIVATE WORKSHOP</div></div>
    </header>

    <div className="settings-intro">Shape the ledger to fit your life.</div>

    <div className="atelier-section">
      <div className="atelier-title"><Wallet size={17}/><div><span>ACCOUNTS</span><small>Where your money lives</small></div></div>
      {accounts.map(x=>
              <div className="account-edit-row" key={x.id}>
                <button
                  className="atelier-row account-row"
                  onClick={()=>editAccount(x)}
                >
                  <span>
                    <strong>{x.name}</strong>
                    <small>
                      {x.currency} · Opening ¥{x.openingBalance.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                      {' · '}
                      {x.includeInNetWorth ? 'Net assets' : 'Spending only'}
                    </small>
                  </span>
                  <em>{x.balance.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</em>
                </button>
                <button
                  className="account-delete-button"
                  onClick={()=>deleteAccount(x)}
                  aria-label={`Delete ${x.name}`}
                >
                  ×
                </button>
              </div>
            )}

            {categories.map(x=><div className="atelier-row" key={x.id}><span>{x.name}</span><em>{x.flow==='expense'?'Expense':'Income'}</em></div>)}
      <button className="atelier-add" onClick={addCategory}><Plus size={15}/> Add category</button>
    </div>

    <div className="atelier-section">
      <div className="atelier-title"><Users size={17}/><div><span>PEOPLE</span><small>Names that matter to your ledger</small></div></div>
      {people.map(x=><div className="atelier-row" key={x.id}><span>{x.name}</span></div>)}
      <button className="atelier-add" onClick={addPerson}><Plus size={15}/> Add person</button>
    </div>

    <div className="atelier-section">
      <div className="atelier-title"><Database size={17}/><div><span>ARCHIVE</span><small>Keep a safe copy of Carina</small></div></div>
      <button className="data-action" onClick={backup}><Download size={15}/> Export backup</button>
      <button className="data-action" onClick={()=>fileRef.current?.click()}><Upload size={15}/> Restore backup</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)restore(f).catch(err=>alert(err.message))}}/>
    </div>
  </section>;
}
