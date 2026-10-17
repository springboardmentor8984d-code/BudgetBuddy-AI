import React,{useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import api from "../api";
export default function Login({onLogin}){
 const [username,setUsername]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");
 const nav=useNavigate();
 async function submit(e){e.preventDefault();try{const r=await api.post("/auth/login",{username,password});
 localStorage.setItem("token",r.data.access_token);const u=await api.get("/users/me");onLogin(u.data);nav("/");
 }catch(err){setError(err.response?.data?.detail||"Login failed")}}
 return <div className="card auth"><h1>Login</h1><form className="form" onSubmit={submit}>
 <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/>
 <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
 <button className="primary">Login</button></form>{error&&<p className="error">{error}</p>}
 <p>New user? <Link to="/register">Create account</Link></p></div>
}
