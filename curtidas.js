const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');

let cookies = ''; // Para armazenar cookies da sessão

// Função de login
async function loginToInstagram(username, password) {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.instagram.com/accounts/login/ajax/',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'X-CSRFToken': 'missing', // Isso é necessário para algumas requisições
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `username=${username}&enc_password=#PWD_INSTAGRAM_BROWSER:0:&password=${password}`,
            withCredentials: true,
        });

        // Verifica se o login foi bem-sucedido e armazena cookies
        if (response.data.authenticated) {
            console.log(chalk.green('Login realizado com sucesso!'));
            cookies = response.headers['set-cookie'];
            return true;
        } else {
            console.log(chalk.red('Falha no login. Verifique seu usuário e senha.'));
            return false;
        }
    } catch (error) {
        console.error(chalk.red('Erro durante o login:', error));
        return false;
    }
}

// Função para curtir postagens
async function likePosts(targetUsername) {
    try {
        // Primeiro, obtemos o ID do usuário alvo
        const userIdResponse = await axios.get(`https://www.instagram.com/${targetUsername}/?__a=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookies.join('; ')
            }
        });

        const userId = userIdResponse.data.graphql.user.id;

        // Obtemos as últimas postagens do usuário alvo
        const postsResponse = await axios.get(`https://i.instagram.com/api/v1/users/${userId}/feed/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookies.join('; '),
                'X-CSRFToken': 'missing'
            }
        });

        // Curtimos cada postagem
        for (let post of postsResponse.data.items) {
            await axios.post(`https://www.instagram.com/web/likes/${post.id}/like/`, null, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookies.join('; '),
                    'X-CSRFToken': 'missing'
                }
            });
            console.log(chalk.green(`Postagem ${post.id} curtida com sucesso!`));
        }

    } catch (error) {
        console.error(chalk.red('Erro ao tentar curtir as postagens:', error));
    }
}

// Função principal para iniciar o processo
(async () => {
    const questions = [
        {
            type: 'input',
            name: 'username',
            message: 'Digite seu nome de usuário:',
            validate: (val) => val.length !== 0 || 'Insira um nome de usuário!'
        },
        {
            type: 'password',
            name: 'password',
            mask: '*',
            message: 'Digite sua senha:',
            validate: (val) => val.length !== 0 || 'Insira uma senha!'
        },
        {
            type: 'input',
            name: 'targetUsername',
            message: 'Digite o nome do usuário alvo (sem "@"):',
            validate: (val) => val.length !== 0 || 'Insira o nome do usuário alvo!'
        }
    ];

    const { username, password, targetUsername } = await inquirer.prompt(questions);

    const isLoggedIn = await loginToInstagram(username, password);
    if (isLoggedIn) {
        await likePosts(targetUsername);
    }
})();
