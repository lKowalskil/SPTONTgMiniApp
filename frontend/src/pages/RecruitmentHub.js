import React, { useState, useEffect } from 'react';
import { toast, ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FixedSizeGrid as Grid } from 'react-window';
import colonistImage from '../images/colonist.png'; 

const RecruitmentHub = () => {
  const [referralLink, setReferralLink] = useState(`None`); 
  const [totalRewards, setTotalRewards] = useState(0);
  const [invitedUsersCount, setInvitedUsersCount] = useState(0);
  const [farmingReward, setFarmingReward] = useState(0);

  const columns = 14; 
  const rowCount = Math.ceil(invitedUsersCount / columns); 

  const columnWidth = 25; 
  const rowHeight = 60; 

  useEffect(() => {
    const user_id = localStorage.getItem('user_id'); 
    setReferralLink(`https://t.me/miniappskowalskitest_bot/BBB?startapp=${user_id}`)
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!', { position: "top-center", autoClose: 2000, style: {backgroundColor: '#111827', color: '#ffffff'} });
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://tgcasinoapp.fun/api/get_user_referral_reward_data`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.ok) {
          const data = await response.json();
          setInvitedUsersCount(data.invited_users_count);
          setTotalRewards(data.total_reward);
          setFarmingReward(data.farming_reward);
        } else {
            throw new Error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
        toast.error('Error, reload the page or try again later...', {
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

    initialize();
}, []);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columns + columnIndex;
    if (index >= invitedUsersCount) return null; 

    return (
      <div style={style}>
        <img 
          src={colonistImage} 
          alt="Colonist" 
          style={{ 
            width: '24px', 
            height: '60px' 
          }} 
        />
      </div>
    );
  };

  return (
    <div className="w-full pt-2 pb-8">
      <div className="flex flex-col items-center justify-center bg-gray-900 p-2">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Recruitment Hub</h1>
            <div className="bg-gray-700 rounded-lg p-4 mb-6 w-full text-left">
                <h2 className="text-xl font-bold text-white mb-2">Your Referral Link</h2>
                <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                    <input 
                        type="text" 
                        value={referralLink} 
                        readOnly 
                        className="bg-transparent text-white w-full outline-none"
                    />
                    <button 
                        onClick={copyToClipboard} 
                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-1 px-3 rounded-lg ml-2"
                    >
                        Copy
                    </button>
                </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 mb-6 w-full text-left">
                <h2 className="text-xl font-bold text-white mb-2">Your Referral Rewards</h2>
                <p className="text-white mb-1">- 10,000 tokens for every invited user.</p>
                <p className="text-white">- 1% of every invited user's farm.</p>

                <div className="text-white mt-4">
                <h3 className="font-bold text-teal-500">Total Rewards Earned:</h3>
                <p className="text-lg">{totalRewards.toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-teal-600 rounded-lg p-4 text-white font-bold w-full text-center">
                <p>Share your referral link and start earning rewards!</p>
            </div>
        </div>
        <div className="text-center text-white mt-4 bg-gray-800 rounded-lg shadow-lg p-6 max-w-md text-center w-full">
          <h3 className="text-lg font-bold">It's your representation of your invited players</h3>
          <Grid
            columnCount={columns}
            columnWidth={columnWidth}
            height={window.innerHeight} 
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={window.innerWidth} 
          >
            {Cell}
          </Grid>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RecruitmentHub;