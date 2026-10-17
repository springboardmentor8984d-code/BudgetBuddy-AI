import React,{useEffect,useState} from "react";
import {Routes,Route,Link,useNavigate} from "react-router-dom";
import api from "./api";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Login from "./pages/Login";
import Register from "./pages/Register";

function Protected({children}){return localStorage.getItem("token")?children:<Login/>}

export default function App(){
 const [user,setUser]=useState(null);const navigate=useNavigate();
 useEffect(()=>{if(localStorage.getItem("token"))api.get("/users/me").then(r=>setUser(r.data)).catch(()=>localStorage.removeItem("token"))},[]);
 function logout(){localStorage.removeItem("token");setUser(null);navigate("/login")}
 return <><nav className="navbar"><Link className="brand" to="/">BudgetBuddy</Link>
 {user&&<div className="navlinks"><Link to="/">Dashboard</Link><Link to="/expenses">Expenses</Link>
 <Link to="/income">Income</Link><Link to="/budgets">Budgets</Link><Link to="/goals">Goals</Link>
 <button onClick={logout}>Logout</button></div>}</nav>
 <main className="container"><Routes>
 <Route path="/login" element={<Login onLogin={setUser}/>}/><Route path="/register" element={<Register/>}/>
 <Route path="/" element={<Protected><Dashboard/></Protected>}/>
 <Route path="/expenses" element={<Protected><Expenses/></Protected>}/>
 <Route path="/income" element={<Protected><Income/></Protected>}/>
 <Route path="/budgets" element={<Protected><Budgets/></Protected>}/>
 <Route path="/goals" element={<Protected><Goals/></Protected>}/>
 </Routes></main></>
}
