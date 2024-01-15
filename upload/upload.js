import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuração de armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './template/uploads');
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original:
        const extensaoArquivo = path.extname(file.originalname);
        fs.unlink('./template/uploads/video.mp4')
        // Cria um código randômico que será o nome do arquivo
        const novoNomeArquivo = new Date().getTime();

        // Indica o novo nome do arquivo:
        cb(null, `video${extensaoArquivo}`);
    }
});

const upload = multer({ storage });

export default upload;