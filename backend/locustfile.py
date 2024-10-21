from locust import HttpUser, TaskSet, task, between
import time

class UserBehavior(TaskSet):
    @task
    def load_app(self):
        # User data
        user_data = '{"id":6076703642,"first_name":"Kowalski","last_name":"","username":"KowalskiO","language_code":"ru","allows_write_to_pm":true}'
        chat_instance = "5782870650940923843"
        chat_type = "private"
        auth_date = "1728676587"
        hash_value = "36f01fde471a67f7a6867f1970737164a5fa0cfa084adcfa814a9f1855a28c9e"
        
        # Constructing the URL with parameters
        url = f"https://tgcasinoapp.fun/?user={user_data}&chat_instance={chat_instance}&chat_type={chat_type}&auth_date={auth_date}&hash={hash_value}"
        
        # Make a GET request to your app
        response = self.client.get(url)

        # Wait for the page to load (simulating user wait time)
        if response.ok:
            time.sleep(3)  # Wait for 3 seconds (adjust as needed)

class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(1, 5)  # Adjust wait time between requests
