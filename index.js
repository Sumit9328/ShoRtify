const express = require('express');
const cors = require('cors');
const { igdl } = require('btch-downloader');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup EJS and public folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Home route
app.get('/', (req, res) => {
  res.render('home', {
    downloadLink: null,
    title: '',
    thumbnail: ''
  });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

// POST route for downloading media
app.post('/download', async (req, res) => {
  const url = req.body.url;
  const ytDlpPath = '"C:\\yt-dlp\\yt-dlp.exe"'; // Update with your path

  // Check if the URL is an Instagram link
  if (url.includes('instagram.com')) {
    try {
      const data = await igdl(url);

      if (!data || data.length === 0) {
        return res.render('home', {
          downloadLink: null,
          title: '❌ No media found for this URL',
          thumbnail: ''
        });
      }

      const media = data[0]; // Assuming the first item is the desired media

      res.render('home', {
        downloadLink: media.url,
        title: media.title || 'Instagram Reel',
        thumbnail: media.thumbnail || ''
      });
    } catch (error) {
      console.error(error);
      res.render('home', {
        downloadLink: null,
        title: '❌ Error fetching Instagram media',
        thumbnail: ''
      });
    }
  } else {
    // Handle YouTube Shorts using yt-dlp
    exec(`${ytDlpPath} -f best -g "${url}"`, (err, stdout, stderr) => {
      if (err || !stdout.trim()) {
        console.error(stderr);
        return res.render('home', {
          downloadLink: null,
          title: '❌ Video not found or invalid link',
          thumbnail: ''
        });
      }

      const downloadLink = stdout.trim();

      exec(`${ytDlpPath} --get-title --get-thumbnail "${url}"`, (metaErr, metaStdout) => {
        if (metaErr) {
          console.error(metaErr);
          return res.render('home', {
            downloadLink: null,
            title: '❌ Unable to fetch metadata',
            thumbnail: ''
          });
        }

        const meta = metaStdout.trim().split('\n');
        const title = meta[0];
        const thumbnail = meta[1];

        res.render('home', {
          downloadLink,
          title,
          thumbnail
        });
      });
    });
  }
});

// 404 for other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
