import https from 'https';

import { htmlToMarkdown, requestUrl } from 'obsidian';

import { JINA_BASE_URL, SERPER_BASE_URL } from '../constants';

import { YoutubeTranscript, isYoutubeUrl } from './youtube-transcript';

interface SearchResult {
	title: string;
	link: string;
	snippet: string;
}

interface SearchResponse {
	organic_results?: SearchResult[];
}

export async function webSearch(query: string, serperApiKey: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const url = `${SERPER_BASE_URL}?q=${encodeURIComponent(query)}&engine=google&api_key=${serperApiKey}&num=20`;

		https.get(url, (res: any) => {
			let data = '';

			res.on('data', (chunk: Buffer) => {
				data += chunk.toString();
			});

			res.on('end', () => {
				try {
					let parsedData: SearchResponse;
					try {
						parsedData = JSON.parse(data);
					} catch {
						parsedData = { organic_results: undefined };
					}
					const results = parsedData?.organic_results;

					if (!results) {
						resolve('');
						return;
					}

					const formattedResults = results.map((item: SearchResult) => {
						return `title: ${item.title}\nurl: ${item.link}\nsnippet: ${item.snippet}\n`;
					}).join('\n\n');

					resolve(formattedResults);
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', (error: Error) => {
			reject(error);
		});
	});
}

async function getWebsiteContent(url: string): Promise<string> {
	if (isYoutubeUrl(url)) {
		// TODO: pass language based on user preferences
		const { title, transcript } =
			await YoutubeTranscript.fetchTranscriptAndMetadata(url)

		return `Title: ${title}
Video Transcript:
${transcript.map((t) => `${t.offset}: ${t.text}`).join('\n')}`
	}

	const response = await requestUrl({ url })

	return htmlToMarkdown(response.text)
}


export async function fetchUrlsContent(urls: string[], apiKey: string): Promise<string> {
	const use_jina = apiKey && apiKey != '' ? true : false
	return new Promise((resolve) => {
		const results = urls.map(async (url) => {
			try {
				const content = use_jina ? await fetchJina(url, apiKey) : await getWebsiteContent(url);
				return `<url_content url="${url}">\n${content}\n</url_content>`;
			} catch (error) {
				console.error(`Failed to fetch URL content: ${url}`, error);
				return `<url_content url="${url}">\n fetch content error: ${error}\n</url_content>`;
			}
		});

		Promise.all(results).then((texts) => {
			resolve(texts.join('\n\n'));
		}).catch((error) => {
			console.error('fetch urls content error', error);
			resolve('fetch urls content error'); // even if error, return some content
		});
	});
}

function fetchJina(url: string, apiKey: string): Promise<string> {
	return new Promise((resolve) => {
		const jinaUrl = `${JINA_BASE_URL}/${url}`;

		const jinaHeaders = {
			'Authorization': `Bearer ${apiKey}`,
			'X-No-Cache': 'true',
		};

		const jinaOptions: https.RequestOptions = {
			method: 'GET',
			headers: jinaHeaders,
		};

		const req = https.request(jinaUrl, jinaOptions, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				try {
					// check if there is an error response
					const response = JSON.parse(data);
					if (response.code && response.message) {
						console.error(`JINA API error: ${response.message}`);
						resolve(`fetch jina content error: ${response.message}`);
						return;
					}
					resolve(data);
				} catch (e) {
					// if not json format, maybe normal content
					resolve(data);
				}
			});
		});

		req.on('error', (e) => {
			console.error(`Error: ${e.message}`);
			resolve(`fetch jina error: ${e.message}`);
		});

		req.end();
	});
}