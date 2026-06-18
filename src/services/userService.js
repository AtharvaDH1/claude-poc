import ApiWrapper from '../util/ApiWrapper';

export const getUsers = () => ApiWrapper.fetchWithToken('user/user');
export const getUserById = (username) => ApiWrapper.fetchWithToken(`user/user/${username}`);
export const addUser = (userData) =>
  ApiWrapper.fetchWithToken('user/user', { method: 'POST', body: JSON.stringify(userData) });
export const updateUser = (userId, userData) =>
  ApiWrapper.fetchWithToken(`user/user/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
export const deleteUser = (userId) =>
  ApiWrapper.fetchWithToken(`users/${userId}`, { method: 'DELETE' });

const userService = { getUsers, getUserById, addUser, updateUser, deleteUser };
export default userService;
