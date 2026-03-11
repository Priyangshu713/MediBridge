import razorpay from './Health-website-backend-main/backend/src/utils/razorpayinstance.js';
import dotenv from 'dotenv';

dotenv.config({ path: './Health-website-backend-main/backend/.env' });

async function testPlans() {
    try {
        console.log("Fetching plans...");
        const plans = await razorpay.plans.all();
        console.log("Success:", plans);
    } catch (e) {
        console.error("Error fetching plans:", e);
    }
}

testPlans();
