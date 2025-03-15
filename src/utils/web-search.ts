import https from 'https';

import { htmlToMarkdown, requestUrl } from 'obsidian';

import { YoutubeTranscript, isYoutubeUrl } from './youtube-transcript';

const SERPER_API_KEY = 'a6fd4dc4b79f10b1e5008b688c81bacef0d24b4d5cd4e52071afa8329a67497c'

interface SearchResult {
	title: string;
	link: string;
	snippet: string;
}

interface SearchResponse {
	organic_results?: SearchResult[];
}

export async function webSearch(query: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&engine=google&api_key=${SERPER_API_KEY}&num=20`;

		console.log(url)

		https.get(url, (res: any) => {
			let data = '';

			res.on('data', (chunk: Buffer) => {
				data += chunk.toString();
			});

			res.on('end', () => {
				try {
					console.log(data)
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

const USE_JINA = true

export async function fetchUrlsContent(urls: string[]): Promise<string> {
	return new Promise((resolve) => {
		const results = urls.map(async (url) => {
			try {
				const content = USE_JINA ? await fetchJina(url) : await getWebsiteContent(url);
				return `<url_content url="${url}">\n${content}\n</url_content>`;
			} catch (error) {
				console.error(`获取URL内容失败: ${url}`, error);
				return `<url_content url="${url}">\n获取内容失败: ${error}\n</url_content>`;
			}
		});
		
		console.log('fetchUrlsContent', results);
		
		Promise.all(results).then((texts) => {
			resolve(texts.join('\n\n'));
		}).catch((error) => {
			console.error('获取URLs内容时出错', error);
			resolve('fetch urls content error'); // 即使出错也返回一些内容
		});
	});
}

function fetchJina(url: string): Promise<string> {
	return new Promise((resolve) => {
		const jinaUrl = `https://r.jina.ai/${url}`;

		const jinaHeaders = {
			'Authorization': 'Bearer jina_1d721eb8c4814a938b4351ae0c3a0f117FlTTAz1GOmpOsIDN7HvIyLbiOCe',
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
				console.log(data);
				
				try {
					// 检查是否有错误响应
					const response = JSON.parse(data);
					if (response.code && response.message) {
						console.error(`JINA API 错误: ${response.message}`);
						resolve(`无法获取内容: ${response.message}`);
						return;
					}
					resolve(data);
				} catch (e) {
					// 如果不是JSON格式，可能是正常的内容
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