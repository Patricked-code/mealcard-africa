'use client';
import { useEffect, useState } from 'react';
import { Nav } from '@/components/Nav';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function token(){return typeof window !== 'undefined' ? localStorage.getItem('mealcard_token') : ''}
export default function Admin(){const [data,setData]=useState<any>(null); useEffect(()=>{fetch(`${API}/admin/overview`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(setData)},[]); return <main className="shell"><Nav/><h1>Back-office admin</h1><section className="grid"><div className="card"><div className="metric">{data?.data?.companies??0}</div><p>Entreprises</p></div><div className="card"><div className="metric">{data?.data?.employees??0}</div><p>Salariés</p></div><div className="card"><div className="metric">{data?.data?.merchants??0}</div><p>Marchands</p></div></section><div className="card" style={{marginTop:18}}><h3>Dernières transactions</h3><pre>{JSON.stringify(data?.data?.transactions||[],null,2)}</pre></div></main>}
