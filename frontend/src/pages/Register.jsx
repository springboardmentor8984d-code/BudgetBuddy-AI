import React,{useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import api from "../api";
export default function Register(){
 const [form,setForm]=useState({username:"",email:"",password:""}),[msg,setMsg]=useState("");
 const nav=useNavigate();
 async function submit(e){e.preventDefault();try{await api.post("/auth/register",form);setMsg("Registration successful. Please login.");setTimeout(()=>nav("/login"),800)}
 catch(err){setMsg(err.response?.data?.detail||"Registration failed")}}
 return <div className="card auth"><h1>Create BudgetBuddy Account</h1><form className="form" onSubmit={submit}>
 {Object.keys(form).map(k=><input key={k} type={k==="password"?"password":"text"} placeholder={k}
 value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}<button className="primary">Register</button></form>
 <p>{msg}</p><p>Already registered? <Link to="/login">Login</Link></p></div>
}
