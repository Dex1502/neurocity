
const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const os = require('os');
const app = express();
const upload = multer({ dest: 'uploads/' });
const { exec } = require('child_process');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/save', async (req, res) => {
    const degValue = -req.body.degValue;
    const imgPath=req.body.imgPath
 

    try {
        const outputImagePath = path.join(__dirname, 'uploads', `rotated_img.png`);
        const image = await Jimp.read(imgPath);
        image.rotate(degValue); 
        await image.writeAsync(outputImagePath);
        res.download(outputImagePath); 
    } catch (err) {
        res.status(500).send('Ошибка');
    }

});


app.post('/upload', upload.single('image'), async (req, res) => {

    const imagePath = path.join(__dirname, req.file.path); 
    const outputImagePath = path.join(__dirname, 'uploads', `userImage.png`); 
    const image = await Jimp.read(imagePath); 
    await image.writeAsync(outputImagePath); 
    
    res.send(`
        <head>
            <link rel="stylesheet" href="/main.css">
            <link rel="stylesheet" href="/upload.css">
        </head>
        <img id="userImg" src="/uploads/userImage.png">

        <div>
            <button id="rotateBtn">Повернуть</button>
            
            <form action="/save" method="POST">
                <input id="degValue" type='hidden' name="degValue">
                <input id="imgPath" type='hidden' name="imgPath" value='${imagePath}'>  
                <button>Сохранить</button>
            </form>

        </div>

        <button id="back">Назад</button>
        
        <script>
                let deg=0
            rotateBtn.addEventListener('click',()=>{
                deg+=90
                userImg.setAttribute('style','transform:rotate('+deg+'deg);')
                degValue.value=deg
            })
            back.addEventListener('click',()=>{
                window.location.href = '/rotate';
            })
        </script>
        `)
});

app.get('/download',(req,res)=>{
    const fileUrl = 'https://store.neuro-city.ru/downloads/for-test-tasks/';
    let iter=0
    fetch(fileUrl).then(resp => resp.json()).then(com => {
        com.forEach(e => {
            let nextUrl=fileUrl + e.name+'/'
            fetch(nextUrl).then(resp => resp.json()).then(com => {
                com.forEach(e=>{
                    iter++
         
                    const fileUrl = nextUrl+e.name;
 
                    const filePath = path.join(__dirname, 'downloads',iter+e.name);
       
                    const file = fs.createWriteStream(filePath);

                    https.get(fileUrl, (response) => {
                        response.pipe(file);

                        file.on('finish', () => {
                            file.close(() => console.log('Файл '+e.name+' загружен в downloads'));
                        });
                    }).on('error', (err) => {
                        fs.unlink(filePath, () => { });
                        console.error('Error downloading the file:', err.message);
                    });
                })
                
            })
        });
    })
})

app.get('/node',(req,res)=>{
    const homeDir = os.homedir();

    fs.readdir(homeDir, (err, files) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Файлы в домашней директории:');
            files.forEach(file => {
                const filePath = path.join(homeDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error(err);
                    } else {
                        if (stats.isFile()) {
                            console.log('Файл:', file);
                        } else if (stats.isDirectory()) {
                            console.log('Папка:', file);
                        }
                    }
                });
            });
        }
    });

    const url="https://store.neuro-city.ru/downloads/for-test-tasks/files-list/"

    fetch(url).then(resp => resp.json()).then(com => {
        console.log('Файлы на сервере: ')
        com.forEach(e => {
            console.log(e.name)
            if(e.size>0){

                const fileUrl = url+e.name;

                const filePath = path.join(__dirname, 'downloads2',e.name);

                const file = fs.createWriteStream(filePath);

                https.get(fileUrl,  (response) => {
                    
                     response.pipe(file);
                    
                    file.on('finish', () => {
                        file.close(() => console.log('Файл '+e.name+' загружен в downloads2'));
                    });
                }).on('error', (err) => {
                    fs.unlink(filePath, () => { });
                    console.error(err.message);
                });
            }
            
        })

    })

    

    exec('start cmd /k "echo Hello, World!"', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
    });



})

app.get('/fileloader',(req,res)=>{
    res.sendFile(path.join(__dirname, 'views', 'fileloader.html'));
})

app.get('/slider',(req,res)=>{
    res.sendFile(path.join(__dirname, 'views', 'slider.html'));
})

app.get('/rotate',(req,res)=>{
    res.sendFile(path.join(__dirname, 'views', 'rotate.html'));
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
