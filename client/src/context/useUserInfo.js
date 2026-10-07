export const getUserInfo = () => {
  const stored = localStorage.getItem('userInfo');
  return stored ? JSON.parse(stored) : null;
};