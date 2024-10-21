import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom';
import { retrieveLaunchParams, postEvent } from '@telegram-apps/sdk';
import { toast, ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import colonistImage from './images/colonist.png'; 
import coinImage from './images/coin.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Loading from "./Loading";
import Upgrades from './pages/Upgrades'; 
import RecruitmentHub from './pages/RecruitmentHub'; 
import Task from './pages/Task';
import Airdrop from './pages/Airdrop';

Modal.setAppElement('#root'); 

function App() {
    const [coinCount, setCoinCount] = useState(0);
    const [colonistsPerTap, setColonistsPerTap] = useState(0); 
    const [colonistsPerHour, setColonistsPerHour] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [coinsGainedWhileAway, setCoinsGainedWhileAway] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [referralRewardDiff, setReferralRewardDiff] = useState(0);

    const [themeStyles, setThemeStyles] = useState({});
    const [loading, setLoading] = useState(true);

    const { initDataRaw, initData } = retrieveLaunchParams ? retrieveLaunchParams() : { initDataRaw: null, initData: null };

    console.log(initDataRaw, initData);

    const getThemeParamsFromHash = () => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const themeParamsString = params.get('tgWebAppThemeParams');
        let themeParams = {};
        if (themeParamsString) {
            try {
                themeParams = JSON.parse(themeParamsString);
            } catch (error) {
                console.error("Failed to parse tgWebAppThemeParams:", error);
            }
        }
    
        return themeParams;
    };

    const themeParams = getThemeParamsFromHash();

    const closeModal = () => {
        setModalVisible(false);
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://tgcasinoapp.fun/api/get_user_data`, {
                method: 'GET',                
                headers: {
                    'Authorization': `Bearer ${token}`
                  },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            if (data.coins_gained_while_away && data.coins_gained_while_away > 0) {
                const coinsGained = data.coins_gained_while_away; 
                setCoinsGainedWhileAway(coinsGained); 
                setReferralRewardDiff(parseInt(data.referral_reward_diff, 10))
                setModalVisible(true); 
            }
            setCoinCount(data.coins_count + coinsGainedWhileAway);
            setColonistsPerTap(data.tap_profit);
            setColonistsPerHour(data.hour_profit);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://tgcasinoapp.fun/api/get_tasks`, {
                method: 'GET',                
                headers: {
                    'Authorization': `Bearer ${token}`
                  },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            setTasks(data);
            console.log(data)
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        const coinInterval = setInterval(fetchCoins, 6000);  

        return () => clearInterval(coinInterval);  
    }, []);

    async function fetchCoins() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://tgcasinoapp.fun/api/get_coins`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const data = await response.json();
            setCoinCount(data.new_coins_count);
        } catch (error) {
            console.error('Error fetching coins:', error);
        }
    }

    const fetchData = async () => {
        if (initData && initData.user) {
            await auth();
            await fetchUserData();
            await fetchTasks();
        }
    };

    const saveUser = async () => {
        try {
            const response = await fetch('https://tgcasinoapp.fun/api/save_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: initData.user,
                    auth_date: initData.authDate,
                    hash: initData.hash,
                    start_param: initData.startParam
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }

            const result = await response.json();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
            postEvent('web_app_set_background_color', { color: "#111827" });
            postEvent('web_app_set_header_color', { color: "#1f2937" });
            localStorage.setItem('user_id', initData.user.id); 
            console.log(initData);
            await saveUser();
            await fetchData();
            setLoading(false); 
        };

        initialize();
    }, []);

    const auth = async () => {
        try {
          const response = await fetch('https://tgcasinoapp.fun/api/auth', {
            method: 'POST',
            headers: {
              'Authorization': `tma ${initDataRaw}`,  
            },
          });
  
          const data = await response.json();
  
        if (response.ok) {
            localStorage.setItem('token', data.access_token);           
        } else {
            postEvent('web_app_open_popup', { 
              title: "Auth Error", 
              message: "Authentication failed, please try again.", 
              buttons: [{ id: "retry", type: "ok" }]
            });
        }
        } catch (err) {               
        }
      };

    const handleClick = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://tgcasinoapp.fun/api/handle_click`, {
                method: 'GET',                
                headers: {
                    'Authorization': `Bearer ${token}`
                  },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch new coins count');
            }
            const data = await response.json();
            const updated_coin_count = data.new_coins_count;
            postEvent('web_app_trigger_haptic_feedback', {type: "impact", impact_style: "medium", notification_type: "success"});
            setCoinCount(updated_coin_count);
        } catch (error) {
            console.error("Error fetching coin count:", error);
        }
    };

    const handleCheckTask = async (taskId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://tgcasinoapp.fun/api/check_task?task_id=${taskId}`, {
            method: 'GET',                
            headers: {
                'Authorization': `Bearer ${token}`
              },
        });
        if (response.ok) {
            const data = await response.json();
            if(data.is_subscriber)
            {
                toast.success('Task done!', {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Flip,
                    style: {backgroundColor: '#111827', color: '#ffffff'}
                    });
            }
            fetchTasks();
        } else {
            toast.error('There was an error, try again later...', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Flip,
                style: {backgroundColor: '#111827', color: '#ffffff'}
                });
        }
    };

    const handleJoinTask = async () => {
        postEvent('web_app_open_tg_link', {path_full: "/spacetoncolony"});
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <Router>
            <div className="App flex flex-col justify-between h-screen bg-gray-900 text-white">
            <nav className="navbar top-navbar fixed top-0 left-0 right-0 flex items-center justify-center bg-gray-800 bg-opacity-95 shadow-md p-4 z-10">
                <div className="indicators flex gap-4">
                    <div className="indicator flex flex-col items-center bg-teal-500 rounded-lg w-24 h-16 p-2">
                        <div className="indicator-label text-sm">Per Tap</div>
                        <div className="indicator-value flex items-center justify-center"> 
                            <img src={coinImage} alt="Coin" className="indicator-image w-5 h-5" />
                            <span className="ml-1">{colonistsPerTap}</span> 
                        </div>
                    </div>
                    <div className="indicator flex flex-col items-center bg-teal-500 rounded-lg w-24 h-16 p-2"> 
                        <div className="indicator-label text-sm">Per Hour</div>
                        <div className="indicator-value flex items-center justify-center">
                            <img src={coinImage} alt="Coin" className="indicator-image w-5 h-5" />
                            <span className="ml-1">{colonistsPerHour}</span>
                        </div>
                    </div>
                </div>
            </nav>


                <div className="main flex flex-col items-center justify-center flex-1 pt-20 pb-20">
                    <div className="coin-display flex items-center gap-2 mt-7">
                        <img src={coinImage} alt="Coin" className="coin-image w-11 h-11" />
                        <span className="coin-count text-5xl font-bold">{coinCount}</span>
                    </div>
                    <div className="content w-full flex justify-center">
                        <Routes>
                            <Route path="/" element={
                                <div className="w-full flex flex-col items-center gap-2" style={{ padding: '20px' }}>
                                    <button className="relative cursor-pointer p-10 mb-5" onClick={handleClick}>
                                        <div className="relative rounded-full w-56 h-56 shadow-lg transition-transform duration-300">
                                            <div className="absolute top-2 left-2 rounded-full bg-gray-800 border-2 border-teal-500 w-48 h-48 flex items-center justify-center">
                                                <img src={colonistImage} alt="Colonist" className="w-full max-w-[70px] transition-transform duration-200" />
                                            </div>
                                        </div>
                                    </button>
                                    {tasks.length === 0 ? (
                                        <p>No tasks available</p>  // Display message if there are no tasks
                                    ) : (
                                        tasks.map(task => (
                                            <Task
                                                key={task.taskId}
                                                taskId={task.taskId}
                                                taskName={task.taskName}
                                                description={task.description}
                                                type={task.type}
                                                reward={task.reward}
                                                link={task.link}
                                                isCompleted={task.is_completed}
                                                onCheck={handleCheckTask}
                                                onJoin={handleJoinTask}
                                            />
                                        ))
                                    )}
                                    <ToastContainer/>
                                </div>
                            } />
                            <Route path="/upgrades" element={<Upgrades
                                colonistsPerTap={colonistsPerTap}
                                colonistsPerHour={colonistsPerHour}
                                coinCount={coinCount}
                                setColonistsPerTap={setColonistsPerTap}
                                setColonistsPerHour={setColonistsPerHour}
                                setCoinCount={setCoinCount} />} />
                            <Route path="/recruitment-hub" element={<RecruitmentHub />} />
                            <Route path="/airdrop" element={<Airdrop />} />
                        </Routes>
                    </div>
                </div>

                <nav className="navbar bottom-navbar fixed bottom-0 left-0 right-0 flex justify-around bg-gray-800 bg-opacity-95 shadow-md p-4 z-10">
                    <ul className="nav-links flex items-center justify-center w-full px-4 space-x-4">
                        <li className="flex flex-col items-center">
                            <NavLink 
                                to="/" 
                                end 
                                className={({ isActive }) => 
                                    `flex flex-col items-center ${isActive ? 'text-teal-500' : 'text-gray-300'} hover:text-teal-500`
                                }>
                                <i className="fas fa-home text-2xl"></i>
                                <span className="text-xs">Home</span> 
                            </NavLink>
                        </li>
                        <div className="h-8 w-px bg-gray-600 mx-2" /> 
                        <li className="flex flex-col items-center">
                            <NavLink 
                                to="/upgrades" 
                                className={({ isActive }) => 
                                    `flex flex-col items-center ${isActive ? 'text-teal-500' : 'text-gray-300'} hover:text-teal-500`
                                }>
                                <i className="fas fa-arrow-up text-2xl"></i>
                                <span className="text-xs">Upgrades</span> 
                            </NavLink>
                        </li>
                        <div className="h-8 w-px bg-gray-600 mx-2" /> 
                        <li className="flex flex-col items-center">
                            <NavLink 
                                to="/recruitment-hub" 
                                className={({ isActive }) => 
                                    `flex flex-col items-center ${isActive ? 'text-teal-500' : 'text-gray-300'} hover:text-teal-500`
                                }>
                                <i className="fa-solid fa-user-group text-2xl"></i>
                                <span className="text-xs">Recruitment</span> 
                            </NavLink>
                        </li>
                        <div className="h-8 w-px bg-gray-600 mx-2" />
                        <NavLink 
                            to="/airdrop" 
                            className={({ isActive }) => 
                                `flex flex-col items-center ${isActive ? 'text-teal-500' : 'text-gray-300'} hover:text-teal-500`
                            }
                        >
                            <img src={coinImage} alt="Coin" className="w-6 h-6 mb-1" /> {/* Add the coin image here */}
                            <span className="text-xs">AirDrop</span>
                        </NavLink>
                    </ul>
                </nav>

              {/* Modal for Welcome Back */}
              {modalVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 max-w-sm text-center">
                            <h2 className="text-xl font-bold">Welcome Back, Commander!</h2>
                            <p className="mt-2">🌌 You’ve earned: <span className="font-semibold">{coinsGainedWhileAway}</span> Coins 🌌<br /> while you were away!</p>
                            <p className="mt-2">🌌 And your referrals earned for you: <span className="font-semibold">{referralRewardDiff}</span> Coins 🌌<br /></p>
                            <p className="mt-4">Your colonists have been hard at work, expanding the colony and gathering resources.</p>
                            <p className="mt-4">Keep building your empire! 💪</p>
                            <div className="flex justify-center mt-4">
                                <button onClick={closeModal} className="bg-teal-500 text-white px-4 py-2 rounded">Tap to continue your journey!</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Router>
    );
}

export default App;
