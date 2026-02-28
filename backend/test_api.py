import requests
import json

BASE_URL = "http://127.0.0.1:5000/api/guest"

def test_login():
    print("Testing Login...")
    payload = {
        "documentType": "CC",
        "documentNumber": "1234567890"
    }
    response = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_create_service(res_id):
    print("\nTesting Create Service Request...")
    payload = {
        "reservationId": res_id,
        "roomNumber": "101",
        "guestName": "Juan Pérez",
        "type": "room-service",
        "details": "Hamburguesa con papas y una soda",
        "priority": "medium"
    }
    response = requests.post(f"{BASE_URL}/services", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_get_notifications(res_id):
    print("\nTesting Get Notifications...")
    response = requests.get(f"{BASE_URL}/notifications/{res_id}")
    print(f"Status: {response.status_code}")
    print(f"Notifications count: {len(response.json())}")

def test_send_message(res_id):
    print("\nTesting Send Message...")
    payload = {
        "reservationId": res_id,
        "roomNumber": "101",
        "content": "Hola, ¿podrían traer más toallas?",
        "sender": "guest"
    }
    response = requests.post(f"{BASE_URL}/messages", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == '__main__':
    try:
        # 1. Login to get reservation info
        login_data = test_login()
        if login_data.get('success'):
            res_id = login_data['reservation']['id']
            
            # 2. Test other endpoints
            test_create_service(res_id)
            test_get_notifications(res_id)
            test_send_message(res_id)
        else:
            print("Login failed, cannot proceed with other tests. Make sure database is seeded.")
    except Exception as e:
        print(f"Error during testing: {e}")
        print("Note: Make sure the Flask server is running on http://127.0.0.1:5000")
