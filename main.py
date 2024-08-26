import os 

from flask import Flask, request, redirect, session, url_for, render_template, jsonify

from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from spotipy.cache_handler import FlaskSessionCacheHandler

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(64)

client_id = '650edf944c264da5aa11c5f94b19db12'
client_secret = 'e80028e9c7414cbf86e97dea9fa6b859'
redirect_uri = 'http://localhost:5000/callback'
scope = 'playlist-read-private, user-library-read user-top-read user-follow-read playlist-modify-public playlist-modify-private'

cache_handler = FlaskSessionCacheHandler(session)
sp_oauth = SpotifyOAuth(
    client_id = client_id, 
    client_secret = client_secret,
    redirect_uri = redirect_uri,
    scope = scope,
    cache_handler = cache_handler
)

sp = Spotify(auth_manager=sp_oauth)

@app.route('/')
def home():
    if not sp_oauth.validate_token(cache_handler.get_cached_token()):
        auth_url = sp_oauth.get_authorize_url()
        return redirect(auth_url)
    return render_template('index.html')
    
@app.route('/callback')
def callback(): 
    sp_oauth.get_access_token(request.args['code'])
    return redirect(url_for('get_playlists'))

@app.route('/get_playlists')
def get_playlists():
    if not sp_oauth.validate_token(cache_handler.get_cached_token()):
        auth_url = sp_oauth.get_authorize_url()
        return redirect(auth_url)
    
    artists = sp.current_user_top_artists(30)
    tracks = sp.current_user_top_tracks(30)

    tracks_info = [(item['artists'][0]['name'], item['name']) for item in tracks['items']]

    genres = sp.recommendation_genre_seeds()


    artist_names = [item['name'] for item in artists['items']]
    return render_template('tracks_filter.html', tracks=tracks['items'], artists=artists['items'], genres=genres['genres'])

@app.route('/process_selection', methods=['POST'])
def process_selection():
    selected_genres = request.json['selectedGenres']
    selected_tracks = request.json['selectedSongs']
    selected_artists = request.json['selectedArtists']
    recs = sp.recommendations(seed_artists=selected_artists, seed_genres=selected_genres, seed_tracks=selected_tracks, limit=10, min_tempo = 150)

    response_data = {
        'recs': recs
    }

    return jsonify(response_data)

@app.route('/make_playlist', methods=['POST'])
def make_playlist():
    playlistTracks = request.json['tracks']
    
    playlist = sp.user_playlist_create(user=sp.current_user()['id'], name="my custom playlist")
    p_id = playlist['id'] 
    track_ids = [track['id'] for track in playlistTracks] 
    sp.playlist_add_items(playlist_id = p_id, items = track_ids)
   
    response_data = {
        'url': playlist['external_urls']['spotify']
    }
    return jsonify(response_data)


@app.route('/logout')
def logout(): 
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)




