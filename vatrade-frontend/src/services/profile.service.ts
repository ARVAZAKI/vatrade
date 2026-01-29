import { config } from '../config/api';
import axios from 'axios';

const API_URL = config.apiUrl;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  role: string;
  paymentDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const profileService = {
  async getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('vatrade-token');
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const token = localStorage.getItem('vatrade-token');
    const response = await axios.put(`${API_URL}/users/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default profileService;
