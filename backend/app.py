from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import hashlib
import hmac
import time
import re
import urllib.parse
import json
import math
import logging
import requests
from config import Config 
from logging.handlers import RotatingFileHandler

app = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,                
    format='%(asctime)s - %(levelname)s - %(message)s', 
    datefmt='%Y-%m-%d %H:%M:%S',         
    handlers=[
        logging.FileHandler("app.log"),  
        logging.StreamHandler()         
    ]
)

handler = RotatingFileHandler('app.log', maxBytes=20000, backupCount=15)

DB_HOST = 'mongo'
DB_PORT = 27017
DB_NAME = 'tg_miniapp'

client = MongoClient(DB_HOST, DB_PORT, maxPoolSize=100)
db = client[DB_NAME] 
users_collection = db['users'] 
upgrades_collection = db['upgrades']
user_upgrades_collection = db['user_upgrades']
cached_upgrades_collection = db['cached_upgrades']
tasks_collection = db['tasks'] 
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
jwt = JWTManager(app)
TELEGRAM_BOT_TOKEN = Config.TELEGRAM_BOT_TOKEN

upgradesData = {
    "Training": [
        { 'name': 'Basic Training', 'bonus': '+1 Colonist/tap', 'cost': '10', 'level': 0 },
        { 'name': 'Skill Drills', 'bonus': '+3 Colonists/tap', 'cost': '50', 'level': 0 },
        { 'name': 'Advanced Training', 'bonus': '+4 Colonists/tap', 'cost': '200', 'level': 0 },
        { 'name': 'Team Training', 'bonus': '+7 Colonists/tap', 'cost': '1,000', 'level': 0 },
        { 'name': 'Elite Training', 'bonus': '+15 Colonists/tap', 'cost': '5,000', 'level': 0 }
    ],
    "Recruitment": [
        { 'name': 'Basic Recruitment', 'bonus': '40 Colonists/hour', 'cost': '100', 'level': 0 },
        { 'name': 'Improved Recruitment', 'bonus': '120 Colonists/hour', 'cost': '500', 'level': 0 },
        { 'name': 'Automated Recruitment', 'bonus': '320 Colonists/hour', 'cost': '2,500', 'level': 0 },
        { 'name': 'Advanced Recruitment', 'bonus': '1,200 Colonists/hour', 'cost': '15,000', 'level': 0 },
        { 'name': 'Quantum Recruitment', 'bonus': '3,000 Colonists/hour', 'cost': '100,000', 'level': 0 }
    ],
    "Camps": [
        { 'name': 'Basic Camp', 'bonus': '+4 Colonists/tap', 'cost': '250', 'level': 0 },
        { 'name': 'Efficient Camp', 'bonus': '+8 Colonists/tap', 'cost': '1,500', 'level': 0 },
        { 'name': 'Resourceful Camp', 'bonus': '+20 Colonists/tap', 'cost': '7,500', 'level': 0 },
        { 'name': 'Advanced Camp', 'bonus': '+30 Colonists/tap', 'cost': '25,000', 'level': 0 },
        { 'name': 'Superior Camp', 'bonus': '+60 Colonists/tap', 'cost': '100,000', 'level': 0 }
    ],
    "Expansion": [
        { 'name': 'Small Colony', 'bonus': '500 Colonists/hour', 'cost': '1,000', 'level': 0 },
        { 'name': 'Medium Colony', 'bonus': '1,200 Colonists/hour', 'cost': '7,500', 'level': 0 },
        { 'name': 'Large Colony', 'bonus': '2,400 Colonists/hour', 'cost': '30,000', 'level': 0 },
        { 'name': 'Planetary Colony', 'bonus': '4,800 Colonists/hour', 'cost': '150,000', 'level': 0 },
        { 'name': 'Interstellar Colony', 'bonus': '12,800 Colonists/hour', 'cost': '1,000,000', 'level': 0 }
    ]
}

task = [
    {
        "taskId": 1,
        "taskName": "Join our Telegram Channel",
        "description": "",
        "type": "telegram_channel",
        "reward": 100000,
        "link": "/spacetoncolony",
        "channel_id": "-1002289433201" 
    }
]

for task in task:
    filter_query = {
        "taskId": task.get('taskId'),
    }

    update_query = {
        "$set": {
            "taskId": task.get('taskId'),
            "taskName": task.get('taskName'),
            "description": task.get('description'),
            "type": task.get('type'),
            "reward": task.get('reward'),
            "link": task.get('link'),
            "channelId": task.get('channel_id')
        }
    }

    result = tasks_collection.update_one(filter_query, update_query, upsert=True)

    if result.upserted_id:
        print(f"Inserted new task: {task.get('taskName')}")
    elif result.modified_count > 0:
        print(f"Updated existing task: {task.get('taskName')}")
    else:
        print(f"No changes made for task: {task.get('taskName')}")
        
        
def determine_type(bonus):
    if 'tap' in bonus:
        return 'tap'
    elif 'hour' in bonus:
        return 'hour'
    return None

def extract_integer(input_string):
    match = re.search(r'(\d{1,3}(?:,\d{3})*)', input_string)
    if match:
        return int(match.group(1).replace(',', ''))
    else:
        raise ValueError("No integer found in the input string.")

def convert_cost_to_int(cost_str):
    return int(cost_str.replace(',', '').strip())

try:
    for category, upgrades in upgradesData.items():
        for upgrade in upgrades:
            upgrade_type = determine_type(upgrade['bonus'])
            upgrade_doc = {
                'name': upgrade['name'],
                'category': category,
                'type': upgrade_type,
                'value': extract_integer(upgrade["bonus"]),
                'cost': convert_cost_to_int(upgrade['cost']),
                'level': upgrade['level']  
            }
            upgrades_collection.update_one(
                {'name': upgrade['name']}, 
                {'$set': upgrade_doc},  
                upsert=True  
            )
except Exception as e:
    logging.error(f"Error: {e}")

def validate_init_data(init_data):
    try:
        if time.time() - int(init_data.get('auth_date', 0)[0]) > 3600:
            return False, 'Token expired'
        return True
    except Exception as e:
        return False

@app.route('/api/auth', methods=['POST'])
def auth():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('tma '):
        logging.error("Invalid or missing authorization header")
        return jsonify({"error": "Invalid or missing authorization header"}), 401

    init_data_raw = auth_header.split(' ')[1]
    init_data = urllib.parse.parse_qs(urllib.parse.unquote(init_data_raw))  
    init_data["user"][0] = json.loads(init_data.get("user")[0])
    
    is_valid = validate_init_data(init_data)
    
    if not is_valid:
        return jsonify({"error": "Unauthorized"}), 401
    user_id = init_data.get("user")[0].get("id")
    access_token = create_access_token(identity=user_id)
    return jsonify({
        "message": "Authentication successful",
        "access_token": access_token
    }), 200

def get_tasks_for_user(user_id):
    tasks = list(tasks_collection.find({}, {'_id': 0}))
    user = users_collection.find_one({"user_id": user_id})
    completed_tasks = user.get('completed_tasks', [])
    for task in tasks:
        if int(task.get("taskId", -100)) in completed_tasks:
            task["is_completed"] = True
        else:
            task["is_completed"] = False

@app.route('/api/check_task', methods=['GET'])
@jwt_required()
def check_task():
    task_id = int(request.args.get('task_id'))
    user_id = get_jwt_identity()
    task = list(tasks_collection.find({'taskId': task_id}, {'_id': 0}))[0]
    channel_id = task.get('channelId')
    
    url = 'http://backend:5001/check_subscription' 

    params = {
        'user_id': user_id,
        'channel_id': channel_id
    }
    
    try:
        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            is_subscriber = data.get("is_subscriber")
            if is_subscriber:
                user_id = str(user_id)
                user = users_collection.find_one({"user_id": user_id})
                completed_tasks = user.get("completed_tasks")
                completed_tasks.append(task_id)
                added_tasks_coins = user.get("added_tasks_coins") + int(task.get("reward"))
                coins_farmed = user.get("coins_farmed") + int(task.get("reward"))
                coins_count = user.get("coins_count") + int(task.get("reward"))
                users_collection.update_one(
                    {"user_id": user_id},
                    {"$set": {"completed_tasks": completed_tasks, "added_tasks_coins": added_tasks_coins, "coins_farmed": coins_farmed, "coins_count": coins_count}}
                )
            return jsonify({"is_subscriber": is_subscriber}), 200
        else:
            logging.error(f"Error while /check_task: {e}")
            return jsonify({"Error": "Try again later..."}), 500
           
    except Exception as e:
        logging.error(f"Error while /check_task: {e}")
        return jsonify({"Error": "Try again later..."}), 500
    

def compute_cost_and_value(level: int, base_cost: int, base_bonus: int):
    cost = math.ceil(base_cost * (pow(1.13, level - 1))) 
    bonus = math.ceil(base_bonus * (pow(1.04, level - 1)))

    if bonus <= base_bonus:
        bonus = base_bonus + 1

    return cost, bonus

def compute_cost_and_value_prev(level: int, base_cost: int, prev_bonus: int):
    cost = math.ceil(base_cost * (pow(1.15, level - 1))) 
    bonus = math.ceil(prev_bonus * 1.04)

    if bonus <= prev_bonus:
        bonus = prev_bonus + 1

    return cost, bonus

def precache_upgrade_values(max_level):
    try:
        cached_upgrades_collection.delete_many({})

        for category, upgrades in upgradesData.items():
            for upgrade in upgrades:
                base_cost = convert_cost_to_int(upgrade['cost'])
                base_value = extract_integer(upgrade['bonus'])
                prev_value = -34534543
                for level in range(0, max_level + 1): 
                    if level == 0:
                        cost, value = 0, 0
                    elif level > 1:
                        cost, value = compute_cost_and_value_prev(level, base_cost, prev_value)
                    else:
                        cost, value = compute_cost_and_value(level, base_cost, base_value)
                    
                    cached_upgrade_doc = {
                        'name': upgrade['name'],
                        'category': category,
                        'level': level,
                        'cost': cost,
                        'value': value
                    }
                    cached_upgrades_collection.insert_one(cached_upgrade_doc)
                    prev_value = value
    except Exception as e:
        logging.error(f"Error while precaching upgrade values: {e}")

precache_upgrade_values(200)

def get_cached_upgrade_value_and_cost(upgrade_name, level):
    cached_upgrade = cached_upgrades_collection.find_one({"name": upgrade_name, "level": level})
    if cached_upgrade:
        return cached_upgrade["cost"], cached_upgrade["value"]
    return None, None

def get_base_update_cost_and_value(upgrade_name):
    upgrades = list(upgrades_collection.find({}, {'_id': 0}))
    base_upgrade = [base_upgrades for base_upgrades in upgrades if base_upgrades["name"] == upgrade_name][0]
    cost = base_upgrade["cost"]
    value = base_upgrade["value"]
    return cost, value

def compute_user_per_tap_profit(user_id):
    user_upgrade = user_upgrades_collection.find_one({"user_id": user_id})
    if user_upgrade:
        user_upgrade = user_upgrade["upgrades"]
        sum_bonus = 0
        for u in user_upgrade:
            if u['type'] == 'tap':
                cost, bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"])
                sum_bonus += bonus
        if sum_bonus == 0:
            sum_bonus = 1
        return sum_bonus
    else:
        return 0

def compute_user_per_hour_profit(user_id):
    user_upgrade = user_upgrades_collection.find_one({"user_id": user_id})
    if user_upgrade:
        user_upgrade = user_upgrade["upgrades"]
        sum_bonus = 0
        for u in user_upgrade:
            if u['type'] == 'hour':
                cost, bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"])
                sum_bonus += bonus
        return sum_bonus
    else:
        return 0

@app.route('/api/get_tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        user_id = str(get_jwt_identity())
        tasks = list(tasks_collection.find({}, {'_id': 0}))
        user = users_collection.find_one({"user_id": user_id})
        completed_tasks = user.get('completed_tasks', [])
        for task in tasks:
            if int(task.get("taskId", -100)) in completed_tasks:
                task["is_completed"] = True
            else:
                task["is_completed"] = False
        return jsonify(tasks), 200
    except Exception as e:
        logging.error(f"Error while getting upgrades /get_tasks: {e}")
        return jsonify({"error": "Something went wrong while retrieving tasks"}), 500

@app.route('/api/upgrade', methods=["POST"])
@jwt_required()
def upgrade():
    user_id = str(get_jwt_identity())
    upgrade_name = request.json.get('name')
    
    if not upgrade_name or not user_id:
        return jsonify({"message": "user_id or upgrade_name has not been provided"}), 400
    
    try:
        user_upgrade = user_upgrades_collection.find_one({"user_id": user_id})
        category_last_upgrade_level = {}
        category_upgrades = {}
        for u in user_upgrade['upgrades']:
            category = u['category']
            
            if category not in category_upgrades:
                category_upgrades[category] = []
            category_upgrades[category].append(u)
        
        for u in user_upgrade['upgrades']:
            category = u['category']
            if u['name'] == upgrade_name:
                category_upgrades_sorted = sorted(category_upgrades[category], key=lambda x: x['cost'])
                first_upgrade = category_upgrades_sorted[0]
                
                if u['name'] == first_upgrade['name']:
                    pass
                else:
                    previous_upgrade_index = category_upgrades_sorted.index(u) - 1
                    if previous_upgrade_index >= 0:
                        previous_upgrade = category_upgrades_sorted[previous_upgrade_index]
                        if previous_upgrade["level"] < 10:
                            return jsonify({"message": f"Upgrade '{upgrade_name}' cannot be unlocked until the previous upgrade '{previous_upgrade['name']}' reaches level 10."}), 400
                user = users_collection.find_one({"user_id": user_id})
                coins_count = int(user["coins_count"])
                cost = int(u["cost"])
                if cost <= coins_count:
                    new_coins_count = coins_count - cost
                    new_cost, new_bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"] + 1)
                    _, next_level_bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"] + 2)
                    
                    u["value"] = new_bonus
                    u["cost"] = new_cost
                    u["level"] += 1
                    u["next_level_bonus"] = next_level_bonus
                    users_collection.update_one(
                        {"user_id": user_id},
                        {"$set": {"coins_count": new_coins_count}}
                    )
                else:
                    return jsonify({"message": "Error, not enough money!"}), 400
        user_upgrades_collection.update_one(
            {"user_id": user_id},
            {"$set": {"upgrades": user_upgrade['upgrades']}}
        )
        new_user_per_tap_profit = compute_user_per_tap_profit(user_id)
        new_user_per_hour_profit = compute_user_per_hour_profit(user_id)

        return jsonify({
            "message": "Success!", 
            "user_upgrades": user_upgrade["upgrades"], 
            "new_coins_count": new_coins_count, 
            "new_user_per_tap_profit": new_user_per_tap_profit, 
            "new_user_per_hour_profit": new_user_per_hour_profit
        }), 200
    
    except Exception as e:
        logging.error(f"Something went wrong while /upgrade: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

    
@app.route('/api/get_upgrades', methods=['GET'])
@jwt_required()
def get_upgrades():
    user_id = str(get_jwt_identity())
    try:
        upgrades = upgrades_collection.find({}, {'_id': 0})
        
        if upgrades:
            upgrades = list(upgrades)
            user_upgrades = user_upgrades_collection.find_one({"user_id": user_id})

            if not user_upgrades:
                user_upgrade = []
                category_last_upgrade_level = {}
                for u in upgrades:
                    user_upgrade.append(u)
                    _, next_level_bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"] + 2)
                    user_upgrade[-1]["next_level_bonus"] = next_level_bonus
                    user_upgrade[-1]['value'] = 0
                    category = u["category"]
                    if category not in category_last_upgrade_level:
                        category_last_upgrade_level[category] = u["level"]
                        user_upgrade[-1]['locked'] = False  
                    else:
                        if category_last_upgrade_level[category] < 10:
                            user_upgrade[-1]['locked'] = True 
                        else:
                            user_upgrade[-1]['locked'] = False 
                        category_last_upgrade_level[category] = u["level"]

                user_upgrades_collection.update_one(
                    {"user_id": user_id}, 
                    {"$set": {"upgrades": user_upgrade}},
                    upsert=True
                )
                return jsonify(user_upgrade), 200

            else:
                user_upgrade = user_upgrades["upgrades"]
                category_last_upgrade_level = {}
                updated_upgrades = []

                for u in user_upgrade:
                    category = u["category"]
                    if category not in category_last_upgrade_level:
                        category_last_upgrade_level[category] = u["level"]
                        u['locked'] = False  
                    else:
                        if category_last_upgrade_level[category] < 10:
                            u['locked'] = True 
                        else:
                            u['locked'] = False 
                        category_last_upgrade_level[category] = u["level"]

                    updated_upgrades.append(u)
                user_upgrades_collection.update_one(
                    {"user_id": user_id}, 
                    {"$set": {"upgrades": updated_upgrades}},
                    upsert=True
                )

                return jsonify(updated_upgrades), 200

        else:
            return jsonify({"message": "No upgrades found"}), 404

    except Exception as e:
        logging.error(f"Error while getting upgrades /get_upgrades: {e}")
        return jsonify({"error": "Something went wrong while retrieving upgrades"}), 500


    except Exception as e:
        logging.error(f"Error while getting upgrades /get_upgrades: {e}")
        return jsonify({"error": "Something went wrong while retrieving upgrades"}), 500

@app.route('/api/get_user_referral_reward_data', methods=['GET'])
@jwt_required()
def get_user_referral_reward_data():
    try:
        user_id = str(get_jwt_identity())
        data = compute_user_referral_reward(user_id)
        return jsonify(data), 200
    except Exception as e:
        logging.error(f"Error while get_user_referral_reward_data: {e}")
        return jsonify({"Error": 'Try again later...'})
        
@app.route('/api/handle_click', methods=['GET'])
@jwt_required()
def handle_click():
    try:
        user_id = str(get_jwt_identity())
        user = users_collection.find_one({"user_id": user_id})
        if user:
            user_tap_profit = compute_user_per_tap_profit(user_id)
            new_coins_count = user.get('coins_count', 0) + user_tap_profit
            prev_coins_farmed = user.get("coins_farmed")
            users_collection.update_one(
                {"user_id": user_id},
                {"$set": {"coins_count": new_coins_count, "coins_farmed": prev_coins_farmed + user_tap_profit}}
            )
            return jsonify({"new_coins_count": new_coins_count, "status": "Coins added successfully"}), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logging.error(f"Error: {e}")
        return jsonify({"status": "Something went wrong, try again later"}), 500

@app.route('/api/get_coins', methods=['GET'])
@jwt_required()
def get_coins():
    try:
        user_id = str(get_jwt_identity())
        user = users_collection.find_one({"user_id": user_id})
        if user:
            last_update = user.get("last_update_time", time.time())
            current_time = time.time()
            elapsed_time_seconds = (current_time - last_update) 
            if elapsed_time_seconds >= 5:
                coins_per_hour = compute_user_per_hour_profit(user_id)
                coins_gained = int((elapsed_time_seconds / 60 / 60) * coins_per_hour)
                if coins_per_hour == 0:
                    users_collection.update_one(
                    {"user_id": user_id},
                    {"$set": {"last_update_time": current_time}})
                if  coins_gained >= 1:
                    new_coins_count = int(user.get("coins_count") + coins_gained)
                    prev_coins_farmed = user.get("coins_farmed")
                    users_collection.update_one(
                    {"user_id": user_id},
                    {"$set": {"coins_count": new_coins_count,
                              "last_update_time": current_time, 
                              "coins_farmed": prev_coins_farmed + int(coins_gained)}})
                    return jsonify({'new_coins_count': new_coins_count}), 200
                else: 
                    return jsonify({'Error': 'Not enough time since last update!'}), 400
            else:
                return jsonify({'Error': 'Not enough time since last update!'}), 400
        else:
            return jsonify({'Error': 'No such user!'}), 400
    except Exception as e:
        logging.error(f"Error while /get_coins: {e}")
        return jsonify({'Error': 'Error, try again later!'}), 400
    
@app.route('/api/get_user_data', methods=['GET'])
@jwt_required()
def get_user():
    try:
        user_id = str(get_jwt_identity())
        user = users_collection.find_one({"user_id": user_id})
        tap_profit = compute_user_per_tap_profit(user_id)
        hour_profit = compute_user_per_hour_profit(user_id)
        last_update = user.get("last_update_time", time.time())
        current_time = time.time()
        elapsed_time_seconds = (current_time - last_update) 
        referral_reward_current = compute_user_referral_reward(user_id).get("total_reward")
        referral_reward_prev = user.get("added_referral_coins")
        referral_reward_diff = int(referral_reward_current - referral_reward_prev)
        if elapsed_time_seconds >= 5:
            coins_per_hour = compute_user_per_hour_profit(user_id)
            coins_gained = int((elapsed_time_seconds / 60 / 60) * coins_per_hour)
            if  coins_gained >= 1:
                new_coins_count = int(user["coins_count"] + coins_gained + referral_reward_diff)
                users_collection.update_one(
                {"user_id": user_id}, {"$set": {"coins_count": new_coins_count, "coins_farmed": int(user.get('coins_farmed') + coins_gained), "last_update_time": current_time, "added_referral_coins": int(referral_reward_current)}})
                if user:
                    user_data = {
                        'user_id': user['user_id'],
                        'first_name': user['first_name'],
                        'last_name': user.get('last_name', ''),
                        'coins_count': user.get('coins_count', 0) + referral_reward_diff,
                        'coins_farmed': user.get('coins_farmed', 0),
                        'coins_gained_while_away': coins_gained,
                        'tap_profit': tap_profit,
                        'hour_profit': hour_profit,
                        'referral_reward_diff': referral_reward_diff
                    }
                    return jsonify(user_data), 200
        coins_count = user.get("coins_count")
        coins_count += referral_reward_diff
        coins_count = int(coins_count)
        users_collection.update_one(
                {"user_id": user_id}, {"$set": {"added_referral_coins": referral_reward_current, "coins_count": coins_count}})
        if user:
            user_data = {
                'user_id': user['user_id'],
                'first_name': user['first_name'],
                'last_name': user.get('last_name', ''),
                'coins_count': user.get('coins_count', 0),
                'coins_farmed': user.get('coins_farmed', 0),
                'tap_profit': tap_profit,
                'hour_profit': hour_profit,
                'referral_reward_diff': referral_reward_diff
            }
            return jsonify(user_data), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logging.error(f"Error: {e}")
        return jsonify({"status": "Something went wrong"}), 500

def compute_user_referral_reward(user_id):
    user = users_collection.find_one({"user_id": user_id})
    
    if not user:
        return {"error": "User not found"}
    referred_users = users_collection.find({"start_param": user_id})

    total_reward = 0
    invited_users_count = 0
    farming_reward = 0

    for referred_user in referred_users:
        invited_users_count += 1
        total_reward += 10000  
        farming_reward += 0.01 * referred_user.get('coins_farmed', 0) 

    total_reward += farming_reward
    
    return {
        "total_reward": total_reward,
        "invited_users_count": invited_users_count,
        "farming_reward": farming_reward,
        "user_id": user_id
    }

@app.route('/api/save_user', methods=['POST'])
def save_user():
    data = request.json.get('user')
    auth_date = request.json.get('auth_date')
    hash_value = request.json.get('hash')
    start_param = request.json.get('start_param', None)

    if not data:
        return jsonify({"error": "User data is required"}), 400

    try:
        user_id = str(data.get('id', ''))
        username = data.get('username', '')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        language_code = data.get('languageCode', '')
        added_to_attachment_menu = data.get('addedToAttachmentMenu', False)
        allows_write_to_pm = data.get('allowsWriteToPm', False)
        photo_url = data.get('photoUrl', '')
        coins_count = 0

        upgrades = upgrades_collection.find({}, {'_id': 0})
        if upgrades:
            upgrades = list(upgrades)
            user_upgrades = user_upgrades_collection.find_one({"user_id": user_id})
            if not user_upgrades:
                user_upgrade = []
                for u in upgrades:
                    user_upgrade.append(u)
                    _, next_level_bonus = get_cached_upgrade_value_and_cost(u["name"], u["level"] + 2)
                    user_upgrade[-1]["next_level_bonus"] = next_level_bonus
                    user_upgrade[-1]['value'] = 0
                user_upgrades_collection.update_one({"user_id": user_id}, {"$set": {"upgrades": user_upgrade}},
                upsert=True)

        user = users_collection.find_one({"user_id": user_id})
        if user:
            coins_count = user.get("coins_count", 0)
            last_update = user.get("last_update_time", time.time())
            start_param = user.get("start_param", None)
            coins_farmed = user.get("coins_farmed", 0)
            added_referral_coins = user.get("added_referral_coins", 0)
            added_tasks_coins = user.get("added_tasks_coins", 0)
            completed_tasks = user.get("completed_tasks", [])
        
        users_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                "language_code": language_code,
                "added_to_attachment_menu": added_to_attachment_menu,
                "allows_write_to_pm": allows_write_to_pm,
                "photo_url": photo_url,
                "last_update_time": last_update if user else time.time(),
                "coins_count": coins_count,
                "coins_farmed": coins_farmed if user else 0,
                "added_referral_coins": added_referral_coins if user else 0,
                "hash": hash_value,
                "start_param": start_param,
                "added_tasks_coins": added_tasks_coins if user else 0,
                "completed_tasks": completed_tasks if user else [],
            }},
            upsert=True 
        )

        return jsonify({"status": "User data saved successfully"}), 200

    except Exception as e:
        logging.error(f"Error: {e}")
        return jsonify({"error": "Something went wrong"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
