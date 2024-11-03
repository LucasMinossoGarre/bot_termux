const puppeteer = require('puppeteer');
const inquirer = require('inquirer').default;

// Função de espera
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Função de login
async function loginToInstagram(page, username, password) {
    console.log("Tentando fazer login...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', username, { delay: 100 });
    await page.type('input[name="password"]', password, { delay: 100 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log("Login realizado com sucesso!");
}

// Função principal para seguir seguidores
async function followFollowers(target, perExec, delayTime, username, password) {
    const browser = await puppeteer.launch({ headless: true });  // Modo headless ativo
    const page = await browser.newPage();

    try {
        await loginToInstagram(page, username, password);

        // Navegar para a página do usuário alvo
        console.log(`Acessando o perfil de @${target}...`);
        await page.goto(`https://www.instagram.com/${target}/`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('a[href$="/followers/"]');
        
        // Acessa a lista de seguidores
        const followersLink = await page.$('a[href$="/followers/"]');
        await followersLink.click();
        console.log("Acessando a lista de seguidores...");

        // Aguardar um pouco para garantir que a lista de seguidores carregue
        await delay(5000);

        // Seleciona a lista de seguidores e começa a seguir
        let follows = 0;

        while (follows < perExec) {
            // Captura todos os botões de "Seguir" usando a classe específica
            const followButtons = await page.$$('button._acan._acap._acas');

            if (followButtons.length === 0) {
                console.log("Nenhum botão de 'Seguir' encontrado. Tentando rolar para carregar mais.");
                await page.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"] ul');
                    dialog?.scrollBy(0, 1000); // Usando `?.` para evitar erro se `dialog` for null
                });
                await delay(2000);
                continue;
            }

            for (const button of followButtons) {
                try {
                    await button.click();
                    console.log("Perfil Seguido!");
                    follows++;

                    if (follows >= perExec) break;
                    await delay(delayTime);  // Pausa entre cada ação de seguir
                } catch (error) {
                    console.error("Erro ao tentar seguir:", error);
                }
            }

            // Rolagem adicional se ainda não alcançou o limite
            await page.evaluate(() => {
                const dialog = document.querySelector('div[role="dialog"] ul');
                dialog?.scrollBy(0, 1000);
            });
            await delay(2000);  // Pausa para garantir que novos seguidores sejam carregados
        }
    } catch (err) {
        console.error("Erro durante o processo:", err);
    } finally {
        await browser.close();
        console.log("Processo concluído e navegador fechado.");
    }
}

// Perguntas para o usuário
(async () => {
    const questions = [
        {
            type: "input",
            name: "username",
            message: "Digite seu nome de usuário:",
            validate: (val) => val.length !== 0 || "Insira um nome de usuário!",
        },
        {
            type: "password",
            name: "password",
            mask: "*",
            message: "Digite sua senha:",
            validate: (val) => val.length !== 0 || "Insira uma senha!",
        },
        {
            type: "input",
            name: "target",
            message: "Digite o nome do usuário alvo (sem '@'):",
            validate: (val) => val.length !== 0 || "Insira o nome do usuário alvo!",
        },
        {
            type: "input",
            name: "perExec",
            message: "Digite o limite por execução:",
            validate: (val) => /[0-9]/.test(val) || "Insira apenas números",
        },
        {
            type: "input",
            name: "delayTime",
            message: "Digite o tempo de espera (em milissegundos):",
            validate: (val) => /[0-9]/.test(val) || "Insira apenas números",
        },
    ];

    const { username, password, target, perExec, delayTime } = await inquirer.prompt(questions);
    await followFollowers(target, parseInt(perExec), parseInt(delayTime), username, password);
})();
