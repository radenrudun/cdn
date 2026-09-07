export async function onRequest({ request, env }) {
	const CORS = {
		"Access-Control-Allow-Origin": "*"
	};

	const url = new URL(request.url);

	const username = url.searchParams.get("username");

	const apiRaden = env.apiRadenV2;

	// =========================
	// VALIDATION
	// =========================

	if (!username) {
		return Response.json(
			{
				status: 400,
				error: "username required"
			},
			{
				status: 400,
				headers: CORS
			}
		);
	}

	const start = Date.now();

	// =========================
	// FETCH HELPER
	// =========================

	async function fetchApi(endpoint) {
		const controller = new AbortController();

		const timeout = setTimeout(() => controller.abort(), 10000);

		try {
			const res = await fetch(endpoint, {
				headers: {
					"x-rapidapi-key": apiRaden,

					"x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",

					Accept: "application/json"
				},

				signal: controller.signal
			});

			clearTimeout(timeout);

			if (!res.ok) {
				throw new Error(`Provider returned ${res.status}`);
			}

			try {
				return await res.json();
			} catch {
				throw new Error("Invalid JSON response");
			}
		} finally {
			clearTimeout(timeout);
		}
	}

	try {
		// =========================
		// FETCH ALL
		// =========================

		const [jsonDetail, jsonPost, jsonRepost] = await Promise.all([
			fetchApi(
				`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${encodeURIComponent(
					username
				)}`
			),

			fetchApi(
				`https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id=${encodeURIComponent(
					username
				)}&count=30`
			),

			fetchApi(
				`https://tiktok-scraper7.p.rapidapi.com/user/reposts?unique_id=${encodeURIComponent(
					username
				)}&cursor=0&count=30`
			)
		]);

		// =========================
		// VALIDATE
		// =========================

		const success =
			jsonDetail?.msg === "success" &&
			jsonPost?.msg === "success" &&
			jsonRepost?.msg === "success";

		if (!success) {
			return Response.json(
				{
					status: 404,
					by: "Raden",
					message: "Account not found"
				},
				{
					status: 404,

					headers: CORS
				}
			);
		}

		const responTime = Date.now() - start;

		// =========================
		// SUCCESS
		// =========================

		return Response.json(
			{
				status: 200,

				by: "Raden",

				responTime,

				result: {
					account: jsonDetail,

					post: jsonPost,

					repost: jsonRepost
				}
			},
			{
				status: 200,

				headers: {
					...CORS,

					"Content-Type": "application/json"
				}
			}
		);
	} catch (err) {
		console.error("TikTok Error:", err);

		return Response.json(
			{
				status: 500,

				by: "Raden",

				error: "Internal Server Error",

				message: err.message
			},
			{
				status: 500,

				headers: {
					...CORS,

					"Content-Type": "application/json"
				}
			}
		);
	}
}
