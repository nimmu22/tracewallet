/** Current market data with a real-data fallback when CoinGecko rejects anonymous requests. */
import {cached,fetchJSON} from './http';
import type {MarketCoin,MarketData} from './types';
async function coinGecko():Promise<MarketData>{
 const headers:Record<string,string>=process.env.COINGECKO_API_KEY?{'x-cg-demo-api-key':process.env.COINGECKO_API_KEY}:{};
 const coins=await fetchJSON<MarketCoin[]>('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false',{headers});
 if(!Array.isArray(coins)||!coins.length)throw new Error('Market unavailable.');
 const prices:Record<string,number>={};for(const c of coins)if(typeof c.current_price==='number')prices[c.id]=c.current_price;
 try{const more=await fetchJSON<Record<string,{usd:number}>>('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,polygon-ecosystem-token,avalanche-2,solana&vs_currencies=usd',{headers});for(const [id,v]of Object.entries(more))if(typeof v.usd==='number')prices[id]=v.usd}catch{/* Missing supplemental quotes do not invalidate the market table. */}
 return {coins,prices,updatedAt:new Date().toISOString(),source:'CoinGecko'};
}
interface Ticker{id:string;name:string;symbol:string;rank:number;last_updated:string;quotes:{USD:{price:number;market_cap:number;percent_change_24h:number}}}
async function coinPaprika():Promise<MarketData>{
 const tickers=await fetchJSON<Ticker[]>('https://api.coinpaprika.com/v1/tickers');
 if(!Array.isArray(tickers)||!tickers.length)throw new Error('Market unavailable.');
 // Rankings are always provider data. These IDs map native assets for fee conversion only.
 const ids:Record<string,string>={'eth-ethereum':'ethereum','bnb-binance-coin':'binancecoin','pol-polygon-ecosystem-token':'polygon-ecosystem-token','avax-avalanche':'avalanche-2','sol-solana':'solana'};
 const prices:Record<string,number>={};for(const t of tickers)if(ids[t.id]&&Number.isFinite(t.quotes?.USD?.price))prices[ids[t.id]]=t.quotes.USD.price;
 const coins=tickers.filter(t=>t.rank>0&&t.quotes?.USD).sort((a,b)=>a.rank-b.rank).slice(0,10).map(t=>({id:t.id,name:t.name,symbol:t.symbol,image:'',market_cap_rank:t.rank,current_price:t.quotes.USD.price,market_cap:t.quotes.USD.market_cap,price_change_percentage_24h:t.quotes.USD.percent_change_24h,last_updated:t.last_updated}));
 return {coins,prices,updatedAt:new Date().toISOString(),source:'CoinPaprika'};
}
export const getMarket=()=>cached<MarketData>('market',60000,async()=>{try{return await coinGecko()}catch{return coinPaprika()}});
