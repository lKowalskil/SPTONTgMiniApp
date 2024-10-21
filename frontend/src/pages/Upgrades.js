import React, { useState, useEffect } from 'react';
import { retrieveLaunchParams, postEvent } from '@telegram-apps/sdk';
import { toast, ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import coinImage from '../images/coin.png'; 

const Upgrades = ({ colonistsPerTap, colonistsPerHour, coinCount, setColonistsPerTap, setColonistsPerHour, setCoinCount }) => {
  const [selectedCategory, setSelectedCategory] = useState("Training");
  const [upgradesData, setUpgradesData] = useState({}); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [selectedUpgrade, setSelectedUpgrade] = useState(null); 
  const [showModal, setShowModal] = useState(false); 

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const fetchUpgrades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tgcasinoapp.fun/api/get_upgrades`, {
        method: 'GET',                
        headers: {
            'Authorization': `Bearer ${token}`
          },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data);
      const structuredData = data.reduce((acc, upgrade) => {
        const { category } = upgrade; 
        if (!acc[category]) acc[category] = []; 
        acc[category].push(upgrade); 
        return acc;
      }, {});

      setUpgradesData(structuredData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUpgrades();
  }, []); 

  const handleUpgradePurchase = async (upgradeName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://tgcasinoapp.fun/api/upgrade', {
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: upgradeName }), 
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.message == "Error, not enough money!")
        {
          throw new Error('Error, not enough money!')
        }else
        {
          throw new Error('Network response was not ok');
        }

      }
      console.log(result);
      const structuredData = result.user_upgrades.reduce((acc, upgrade) => {
        const { category } = upgrade; 
        if (!acc[category]) acc[category] = []; 
        acc[category].push(upgrade); 
        return acc;
      }, {});
      setUpgradesData(structuredData);
      setCoinCount(result.new_coins_count);
      setColonistsPerTap(result.new_user_per_tap_profit);
      setColonistsPerHour(result.new_user_per_hour_profit);
      fetchUpgrades();
      toast.success('Upgrade is successfull', {
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
    } catch (error) {
      const errorMessage = error?.message || error;
      if (errorMessage == "Error, not enough money!")
      {
        toast.error('Not enough money', {
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
      }else
      {
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
    }
  };

  const handleUpgradeClick = (upgrade) => {
    setSelectedUpgrade(upgrade);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUpgrade(null);
  };

  const confirmPurchase = () => {
    if (selectedUpgrade) {
      handleUpgradePurchase(selectedUpgrade.name);
      closeModal();
    }
  };

  if (loading) {
    return <div>Loading upgrades...</div>;
  }

  if (error) {
    return <div>Error fetching upgrades...</div>;
  }

  return (
    <div className="main flex flex-col items-center p-4">
        {/* Category Buttons */}
        <div className="category-buttons flex justify-center mb-4 space-x-2 bg-gray-800 rounded-lg p-1">
            {Object.keys(upgradesData).map((category) => (
                <button 
                    key={category} 
                    className={`category-button transition-colors duration-300 px-3 py-2 rounded-lg text-sm font-medium 
                        ${category === selectedCategory ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-300 hover:bg-teal-400 hover:text-white'}`}
                    onClick={() => handleCategoryChange(category)}
                >
                    {category}
                </button>
            ))}
        </div>

        {/* Upgrades Grid */}
        <div className="upgrades-grid grid grid-cols-2 sm:grid-cols-2 gap-4 w-full max-w-6xl">
          {upgradesData[selectedCategory].map((upgrade) => (
            <div 
              key={upgrade.name} 
              className={`upgrade-card relative ${upgrade.locked ? 'bg-gray-600' : 'bg-gray-800'} text-white rounded-lg shadow-lg p-4 transition-transform duration-300 ${upgrade.locked ? '' : 'hover:scale-105'} flex flex-col justify-between`}
              style={{ minHeight: '200px' }} // Set a minimum height for consistent sizing
            >
              <div>
                <h3 className="text-base font-bold mb-2">{upgrade.name}</h3>
                <p className="mb-4">{upgrade.value}/{upgrade.type}</p>
              </div>
              
              <div className="upgrade-footer flex items-center justify-between mt-auto">
                {/* Use mt-auto to push footer down */}
                <div className="upgrade-level text-sm">
                  <p>lvl {upgrade.level}</p>
                </div>
                
                <button 
                  className={`upgrade-buy-button flex items-center ${upgrade.locked ? 'bg-gray-500 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'} text-white rounded-lg px-2 py-2 transition-colors duration-300`}
                  onClick={() => !upgrade.locked && handleUpgradeClick(upgrade)} 
                  disabled={upgrade.locked}  // Disable the button if the upgrade is locked
                >
                  <img src={coinImage} alt="coin" className="coin-image-upgrade-button w-5 h-5 mr-1" />
                  {upgrade.locked ? 'Locked' : upgrade.cost}
                </button>
              </div>

              {/* Add a locked overlay or icon only if upgrade is locked */}
              {upgrade.locked && (
                <div className="locked-overlay absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01"></path>
                    </svg>
                    <span className="text-xl font-semibold text-red-500">Locked</span>
                    <p className="text-sm text-gray-300 mt-1">Reach level 10 of the previous upgrade</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal for Confirm Purchase */}
        {showModal && selectedUpgrade && (
            <div className="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                <div className="modal-content bg-gray-800 rounded-lg shadow-lg p-6 text-center text-white">
                    <h3 className="text-lg font-bold mb-4">Confirm Purchase</h3>
                    <p className="mb-2">You are about to purchase <strong>{selectedUpgrade.name}</strong>.</p>
                    <p className="mb-4">+{selectedUpgrade.next_level_bonus - selectedUpgrade.value}/{selectedUpgrade.type}</p>
                    <p className="mb-6">Cost: {selectedUpgrade.cost} STON</p>
                    <div className="modal-actions flex justify-center gap-4">
                        <button className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600" onClick={confirmPurchase}>Confirm</button>
                        <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600" onClick={closeModal}>Cancel</button>
                    </div>
                </div>
            </div>
        )}
      <ToastContainer/>
    </div>
);
};

export default Upgrades;
