/**
 * API Research Script - Find free clinical trial and healthcare APIs
 * Uses z-ai-web-dev-sdk for web searching
 */

import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
}

async function searchAPIs() {
  const zai = await ZAI.create();
  
  const searches = [
    {
      query: "free clinical trial API healthcare medical data REST 2024",
      filename: "clinical-trial-apis.json"
    },
    {
      query: "FDA drug trial database API open access free tier",
      filename: "fda-database-apis.json"
    },
    {
      query: "Medidata Rave API clinical data integration developer",
      filename: "medidata-api-info.json"
    },
    {
      query: "Veeva Vault EDC API integration clinical trials",
      filename: "veeva-api-info.json"
    },
    {
      query: "Oracle Clinical One API EDC system integration",
      filename: "oracle-clinical-api.json"
    }
  ];

  const resultsDir = '/home/z/my-project/TrialGTPBot-Enterprise/docs/api-research';
  
  console.log('🔍 Searching for Clinical Trial & Healthcare APIs...\n');

  for (const search of searches) {
    try {
      console.log(`Searching: ${search.query}`);
      
      const searchResults = await zai.functions.invoke('web_search', {
        query: search.query,
        num: 8
      });

      const outputPath = path.join(resultsDir, search.filename);
      
      fs.writeFileSync(outputPath, JSON.stringify({
        query: search.query,
        searchedAt: new Date().toISOString(),
        results: searchResults
      }, null, 2));

      console.log(`✅ Found ${searchResults.length} results → ${search.filename}`);
      
      searchResults.slice(0, 3).forEach((result: SearchResult, i: number) => {
        console.log(`   ${i + 1}. ${result.name}`);
        console.log(`      ${result.url}`);
      });
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error searching "${search.query}":`, error);
    }
  }

  console.log('✨ API research complete!');
}

searchAPIs().catch(console.error);
