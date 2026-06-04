import { API_URL } from "../util/config";
import wrapper from '../util/ApiWrapper';

const trapScoreService = async (trapScoreData) => { 
    // console.log(trapScoreData)
    const response = await wrapper.fetchWithToken(`/trap-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trapScoreData:trapScoreData
      })
    });

    const data = await response.json();
    console.log(data)
    return data;
  }
  export default trapScoreService