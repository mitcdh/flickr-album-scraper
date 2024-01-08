require('dotenv').config();
const axios = require('axios');

const FLICKR_API_KEY = process.env.FLICKR_API_KEY;
const USER_ID = process.env.FLICKR_USER_ID;

const getAlbums = async () => {
    try {
      const response = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photosets.getList&api_key=${FLICKR_API_KEY}&user_id=${USER_ID}&format=json&nojsoncallback=1`);
      const albums = response.data.photosets.photoset;
  
      return Promise.all(albums.map(async album => {
        const albumDetailsResponse = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photosets.getInfo&api_key=${FLICKR_API_KEY}&photoset_id=${album.id}&format=json&nojsoncallback=1`);
        const albumDetails = albumDetailsResponse.data.photoset;
        const updatedTitle = albumDetails.title._content.replace(/^\d{4}-\d{2}\s*/, '');
  
        const primaryPhotoResponse = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=${FLICKR_API_KEY}&photo_id=${album.primary}&format=json&nojsoncallback=1`);
        const primaryPhoto = primaryPhotoResponse.data.photo;
        const primaryPhotoUrl = `https://farm${primaryPhoto.farm}.staticflickr.com/${primaryPhoto.server}/${primaryPhoto.id}_${primaryPhoto.secret}.jpg`;
  
        const lastPhotoResponse = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=${FLICKR_API_KEY}&photoset_id=${album.id}&user_id=${USER_ID}&format=json&nojsoncallback=1`);
        const photos = lastPhotoResponse.data.photoset.photo;
        const lastPhoto = photos[photos.length - 1];
  
        const exifResponse = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=${FLICKR_API_KEY}&photo_id=${lastPhoto.id}&format=json&nojsoncallback=1`);
        const exifData = exifResponse.data.photo;
        const dateTimeOriginal = exifData.exif.find(tag => tag.tag === 'DateTimeOriginal');
  
        return {
          title: updatedTitle,
          description: albumDetails.description._content,
          lastPhotoTimestamp: dateTimeOriginal ? dateTimeOriginal.raw._content : 'Unknown',
          link: `https://www.flickr.com/photos/${USER_ID}/sets/${album.id}`,
          featureImageUrl: primaryPhotoUrl
        };
      }));
    } catch (error) {
      console.error('Error fetching data from Flickr API:', error);
    }
  };

// Export the function for use in other files
module.exports = getAlbums;

// Check if the script is being run directly
if (require.main === module) {
  getAlbums().then(albumsData => {
    console.log('Album Data:', albumsData);
  }).catch(error => {
    console.error('Error:', error);
  });
}
