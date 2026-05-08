'use client';
import { useState } from 'react';
import { Nav } from '@/components/Nav';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function Login() {
  const [email,setEmail]=useState('admin@mealcard.africa'); const [password,setPassword]=useState('AdminPassword123!'); const [token,setToken]=useState(''); const [error,setError]=useState('');
  async function submit(){setError(''); const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}); const j=await r.json(); if(!r.ok){setError(j.error||'Erreur');return} localStorage.setItem('mealcard_token',j.data.token); setToken(j.data.token)}
  return <main className="shell"><Nav/><div className="card" style={{maxWidth:520}}><h1>Connexion</h1><p className="muted">Utilise les comptes de démonstration du README.</p><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)}/><label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="btn primary" onClick={submit}>Se connecter</button>{error&&<p style={{color:'crimson'}}>{error}</p>}{token&&<p className="muted">Token enregistré. Tu peux ouvrir l’espace correspondant au rôle.</p>}</div></main>
}
