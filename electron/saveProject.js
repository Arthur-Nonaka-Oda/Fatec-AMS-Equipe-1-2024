const path = require("path");
const fs = require("fs");

let projectId = null;

function createProjectDirectory() {
    const projectDir = path.join(__dirname, "projects");
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
    }
}

async function saveProject(projectData) {
    createProjectDirectory();
    
    // Se não há ID, gerar um novo
    if (!projectData.id) {
        projectData.id = Math.floor(Date.now() / 1000).toString();
    }
    
    // Criar diretório do projeto se não existir
    const projectDir = path.join(__dirname, "projects", projectData.id);
    const projectPath = path.join(projectDir, `${projectData.id}.json`);
    const blobsDir = path.join(projectDir, "blobs");
    const isNewProject = !fs.existsSync(projectPath);
    
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
    }
    
    if (!fs.existsSync(blobsDir)) {
        fs.mkdirSync(blobsDir, { recursive: true });
    }
    
    // Processar blobs dos arquivos de mídia
    const processedProjectData = await processBlobsInProjectData(projectData, blobsDir);
    
    // Salvar o arquivo JSON do projeto
    fs.writeFileSync(projectPath, JSON.stringify(processedProjectData, null, 2));
    
    if (isNewProject) {
        console.log(`Novo projeto criado em: ${projectPath}`);
    } else {
        console.log(`Projeto atualizado em: ${projectPath}`);
    }
    
    return processedProjectData.id;
}

async function processBlobsInProjectData(projectData, blobsDir) {
    const processedData = JSON.parse(JSON.stringify(projectData)); // Deep clone
    
    // Processar cada camada
    if (processedData.layers) {
        for (let layerIndex = 0; layerIndex < processedData.layers.length; layerIndex++) {
            const layer = processedData.layers[layerIndex];
            if (layer.files) {
                for (let fileIndex = 0; fileIndex < layer.files.length; fileIndex++) {
                    const fileItem = layer.files[fileIndex];
                    
                    // Processar blob se existir
                    if (fileItem.data && fileItem.data.blob) {
                        try {
                            const blobPath = await saveBlobToFile(fileItem.data, blobsDir, fileIndex, layerIndex);
                            
                            // Remover o blob do objeto e adicionar o caminho do blob salvo
                            delete fileItem.data.blob;
                            fileItem.data.blobPath = blobPath;
                            
                            console.log(`Blob salvo: ${blobPath}`);
                        } catch (error) {
                            console.error(`Erro ao salvar blob do arquivo ${fileItem.data.name}:`, error);
                            // Remove o blob se houver erro, mas mantém os outros dados
                            delete fileItem.data.blob;
                        }
                    }
                }
            }
        }
    }
    
    return processedData;
}

async function saveBlobToFile(fileData, blobsDir, fileIndex, layerIndex) {
    const timestamp = Date.now();
    const extension = getFileExtension(fileData.filePath || fileData.name);
    const fileName = `layer${layerIndex}_file${fileIndex}_${timestamp}${extension}`;
    const blobPath = path.join(blobsDir, fileName);
    
    console.log(`💾 Salvando blob para: ${fileData.name}`);
    console.log(`📂 Caminho de destino: ${blobPath}`);
    console.log(`🏷️ Tipo do blob:`, typeof fileData.blob);
    
    // Se o blob for uma string base64, decodificar
    if (typeof fileData.blob === 'string') {
        console.log(`📝 Blob é uma string, processando como base64...`);
        const base64Data = fileData.blob.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(blobPath, buffer);
        console.log(`✅ Blob string salvo: ${buffer.length} bytes`);
    } else if (fileData.blob && typeof fileData.blob === 'object') {
        console.log(`🔗 Blob é um objeto, tentando usar filePath: ${fileData.filePath}`);
        // Se for um objeto blob do navegador, não podemos salvá-lo diretamente no Electron
        // Neste caso, tentamos usar o filePath original se disponível
        if (fileData.filePath && fs.existsSync(fileData.filePath)) {
            fs.copyFileSync(fileData.filePath, blobPath);
            console.log(`✅ Arquivo copiado do filePath original`);
        } else {
            console.error(`❌ FilePath não disponível ou não existe: ${fileData.filePath}`);
            throw new Error('Blob do navegador não pode ser salvo diretamente e filePath não disponível');
        }
    } else {
        console.error(`❌ Tipo de blob não suportado:`, typeof fileData.blob);
        throw new Error(`Tipo de blob não suportado: ${typeof fileData.blob}`);
    }
    
    return blobPath;
}

function getFileExtension(filePath) {
    if (!filePath) return '.mp4'; // Default para vídeo
    
    const ext = path.extname(filePath).toLowerCase();
    return ext || '.mp4';
}

function getProjects() {
    createProjectDirectory();
    const projectsDir = path.join(__dirname, "projects");

    const directories = fs.readdirSync(projectsDir).filter(file => {
        const fullPath = path.join(projectsDir, file);
        return fs.statSync(fullPath).isDirectory();
    });

    // Retorna informações dos projetos
    return directories.map(dir => {
        const projectPath = path.join(projectsDir, dir, `${dir}.json`);
        if (fs.existsSync(projectPath)) {
            try {
                const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
                return {
                    id: dir,
                    name: projectData.name || `Projeto ${dir}`,
                    createdAt: projectData.createdAt || new Date().toISOString(),
                    updatedAt: projectData.updatedAt || projectData.createdAt || new Date().toISOString(),
                    layers: projectData.layers || []
                };
            } catch (error) {
                console.error(`Erro ao ler projeto ${dir}:`, error);
                return {
                    id: dir,
                    name: `Projeto ${dir}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    layers: []
                };
            }
        }
        return null;
    }).filter(project => project !== null);
}

async function loadProject(projectId) {
    if (projectId === null) {
        throw new Error("No project ID set. Please set a project ID before loading.");
    }

    const projectDir = path.join(__dirname, "projects", projectId);
    const projectPath = path.join(projectDir, `${projectId}.json`);
    
    if (fs.existsSync(projectPath)) {
        const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        
        // Restaurar blobs dos arquivos
        const restoredProjectData = await restoreBlobsInProjectData(projectData, projectDir);
        
        return restoredProjectData;
    } else {
        throw new Error(`Project with ID ${projectId} does not exist.`);
    }
}

async function restoreBlobsInProjectData(projectData, projectDir) {
    const restoredData = JSON.parse(JSON.stringify(projectData)); // Deep clone
    
    // Processar cada camada
    if (restoredData.layers) {
        for (let layerIndex = 0; layerIndex < restoredData.layers.length; layerIndex++) {
            const layer = restoredData.layers[layerIndex];
            if (layer.files) {
                for (let fileIndex = 0; fileIndex < layer.files.length; fileIndex++) {
                    const fileItem = layer.files[fileIndex];
                    
                    // Restaurar blob se blobPath existir
                    if (fileItem.data && fileItem.data.blobPath) {
                        try {
                            const fullBlobPath = path.resolve(fileItem.data.blobPath);
                            
                            if (fs.existsSync(fullBlobPath)) {
                                // Ler o arquivo blob e converter para base64
                                const blobBuffer = fs.readFileSync(fullBlobPath);
                                const base64Data = blobBuffer.toString('base64');
                                
                                // Determinar o MIME type baseado na extensão
                                const mimeType = getMimeType(fileItem.data.blobPath);
                                const dataUrl = `data:${mimeType};base64,${base64Data}`;
                                
                                console.log(`📁 Arquivo encontrado: ${fullBlobPath}`);
                                console.log(`📊 Tamanho do buffer: ${blobBuffer.length} bytes`);
                                console.log(`🎭 MIME type: ${mimeType}`);
                                console.log(`📋 Base64 length: ${base64Data.length} caracteres`);
                                
                                // Restaurar como blob base64 para compatibilidade com o frontend
                                fileItem.data.blobBase64 = dataUrl;
                                
                                console.log(`✅ Blob restaurado para: ${fileItem.data.name}`);
                            } else {
                                console.warn(`⚠️ Arquivo blob não encontrado: ${fullBlobPath}`);
                            }
                        } catch (error) {
                            console.error(`Erro ao restaurar blob do arquivo ${fileItem.data.name}:`, error);
                        }
                    }
                }
            }
        }
    }
    
    return restoredData;
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mp3',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.aac': 'audio/aac',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
}

async function saveImports(filePath) {
    createProjectDirectory();
    let importsPath;
    if (projectId === null) {
        projectId = Math.floor(Date.now() / 1000).toString(); // Generate a unique project ID based on the current timestamp
        importsPath = path.join(__dirname, "projects", projectId, "imports");
        fs.mkdirSync(importsPath, { recursive: true });
    } else {
        importsPath = path.join(__dirname, "projects", projectId, "imports");
        if (!fs.existsSync(importsPath)) {
            fs.mkdirSync(importsPath, { recursive: true });
        }
    }

    const fileName = path.basename(filePath);
    const destPath = path.join(importsPath, fileName);

    fs.copyFileSync(filePath, destPath);
    console.log("Arquivo copiado para:", destPath);
    return destPath;
}

function setProjectId(id) {
    projectId = id;
}

function getCurrentProjectId() {
    return projectId;
}

module.exports = {
    saveProject,
    loadProject,
    saveImports,
    getProjects,
    createProjectDirectory,
    setProjectId,
    getCurrentProjectId
}