const http = require('http');
const fs = require('fs');
const mime = require('mime-types')
const html_to_pdf = require('html-pdf-node');
const url = require('node:url');

const convert2Pdf = (url, res) => {
  if (url.match(/^[a-zA-Z]{2,}:\/\/[A-Za-z0-9_\/\-\.\?=%]+/)) {
    let options = {
      format: 'A4',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    // Example of options with args //
    // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

    let file = { url };

    // fs.appendFileSync(__dirname + '/log.txt', "generating pdf\n");

    html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
      // console.log("PDF Buffer:-", pdfBuffer);

      // fs.appendFileSync(__dirname + '/log.txt', "buffer\n");

      res.writeHead(200, {
        'Content-Type': 'application/pdf; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Content-Disposition': 'inline'
      });
      res.write(pdfBuffer);
      res.end();
    });

  } else {
    res.writeHead(400);
    res.write(
      'Invalid URL format'
    );
    res.end();
  }



}

const server = http.createServer(function (req, res) {

  // console.log('req', req.url, req.headers);

  const urlParsed = url.parse(req.url, true)

  switch(urlParsed.pathname) {
    case '/':
      // server the index page
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      });
      res.write(
        fs.readFileSync(__dirname + '/httpdocs/index.html', 'utf-8')
      );
      res.end();
      break;

    case '/convert':
      // utilize the convert script

      if (req.method === 'GET' && urlParsed.query && urlParsed.query.url) {
        convert2Pdf(urlParsed.query.url, res);
      } else if (req.method === 'POST') {
        var body = [];
        req.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
          body = Buffer.concat(body).toString();
          const searchparams = new URLSearchParams(body)

          // console.log('body string', body);
          const converturl = searchparams.get('url')
          if (converturl) {
            convert2Pdf(converturl, res);
          } else {
            res.writeHead(400);
            res.write(
              'Invalid URL format'
            );
            res.end();
          }
        });
      } else {
        res.writeHead(400);
        res.write(
          'Invalid URL format'
        );
        res.end();
      }
      break;

    default:
      // check if we have that file in httpdocs - then serve it, otherwise answer with 404
      if (fs.existsSync(__dirname + '/httpdocs/' + req.url)) {

        const filename = req.url.split('/').pop();

        res.writeHead(200, {
          'Content-Type': mime.lookup(filename) + '; charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        });
        res.write(
          fs.readFileSync(__dirname + '/httpdocs/' + req.url)
        );

      } else {
        res.writeHead(404);
        res.write(
          'Not Found'
        );
      }
      res.end();


  }

	
	
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(process.env.PORT);