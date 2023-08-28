require('dotenv').config();
const axios = require("axios");
const mediaArray = require("./mediaArr");
const media = require('./media');

async function searchBox(app) {
    app.post("/search", async (req, res) => {
        try {
            let movieData = (await mediaArray((await axios.get("https://api.themoviedb.org/3/search/movie?api_key=" + process.env.TMDB_KEY + "&query=" + req.body.searchText)).data, "movie", 'search'));

            let tvData = (await mediaArray((await axios.get("https://api.themoviedb.org/3/search/tv?api_key=" + process.env.TMDB_KEY + "&query=" + req.body.searchText)).data, "tv", 'search'));

            res.json(movieData, tvData);
        }
        catch (err) {
            console.log('err');
        }
    })








    app.post('/searchInfo', async (req, res) => {
        if (req.body.type == 'movie' || 'null') {
            try {
                let movieData = await media((await axios.get('https://api.themoviedb.org/3/movie/' + req.body.id + '?api_key=' + process.env.TMDB_KEY)).data, 'movie', 'search')
                // console.log(movieData.data);
                // res.json(movieData.data)
            }
            catch (e) {
                try {
                    let tvData = await media((await axios.get('https://api.themoviedb.org/3/tv/' + req.body.id + '?api_key=' + process.env.TMDB_KEY)).data, 'movie', 'search')
                    // console.log(tvData.data)
                }
                catch (err) {
                    console.log(err)
                }
            }
        }
        else if (req.body.type == 'tv') {
            try {
                let tvData = media((await axios.get('https://api.themoviedb.org/3/tv/' + req.body.id + '?api_key=' + process.env.TMDB_KEY)).data, 'tv', 'search')
                res.json(tvData.data)
            }
            catch (e) {
                res.json('not found')
            }
        }

    })
}
module.exports = searchBox