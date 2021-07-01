/*      
        Matheus Rossetti
        Agenda de Contatos
*/
//Criar Server com Express
const hostname = '127.0.0.1';
const port = 8585;

const   express = require("express"),
        exphbs  = require("express-handlebars"),
        session = require('express-session'),
        bodyParser = require("body-parser"),
        passport = require('passport-local'),
        path = require('path'),
        Sequelize = require('sequelize');

//Conexao MySQL com Sequelize
const sequelize = new Sequelize('agendacontato', 'mradmin', 'mr@dmin1060', 
{
    host:'localhost',
    dialect: 'mysql'
});

sequelize.authenticate().then(function(){
    console.log('Conexão realizada com sucesso com o BD');
}).catch(function(err){
    console.log('Erro na conexão realizada com o BD');
});

const Users = sequelize.define('Users', {
    idUser: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeUser: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    userUser: {
        type: Sequelize.STRING,
        allowNull: false
    },
    emailUser: {
        type: Sequelize.STRING,
        allowNull: false
    },
    telefoneUser: {
        type: Sequelize.STRING,
        allowNull: true
    },
    nascUser: {
        type: Sequelize.DATE,
        allowNull: true
    },
    senhaUser: {
        type: Sequelize.STRING,
        allowNull: false
    },
    fotoUser: {
        type: Sequelize.BLOB
    }
});

const contUsers = sequelize.define('contUsers', {
    idContato: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeContato: {
        type: Sequelize.STRING,
        allowNull: false
    },
    emailContato: {
        type: Sequelize.STRING,
        allowNull: true
    },
    telefoneContato: {
        type: Sequelize.STRING,
        allowNull: true
    },
    nascContato: {
        type: Sequelize.DATE,
        allowNull: true
    },
    fotoContato: {
        type: Sequelize.BLOB,
    }
});

Users.sync({force: false});                         //Cria tabela no BD caso esse esteja vazio
Users.hasMany(contUsers);                           //Adicionar chave estrangeira a tabela de contatos
contUsers.sync({force: false});                     //Cria tabela no BD caso esse esteja vazio

const app = express();

app.engine('.handlebars', exphbs({
    extname: '.handlebars',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}));
app.set('view engine', 'handlebars');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


//ROTEAMENTOS
//TELA INICIAL
app.get('/', function (req, res) {
    if (req.session.loggedin == true) {
        res.redirect('/contatos');
    } 
    else 
    {
        res.render('partials/login');
    }
});
app.post('/', function (req, res) {
    //Verificar o usuario logado
    if(req.session.loggedin == true)
    {
        res.redirect('/contatos');
    }
    else
    {
        res.render('partials/login');
    }
});
//CADASTRO E ENVIO DE USUARIOS
app.post('/envioCad', function (req, res) {
    Users.create({
        nomeUser: req.body.nomeUser,
        userUser: req.body.userUser,
        emailUser: req.body.emailUser,
        telefoneUser: req.body.telefoneUser,
        nascUser: req.body.nascUser,
        senhaUser: req.body.senhaUser
    }).then(function(){               
        Users.findOne({
            where: { 
                userUser: req.body.userUser,
                senhaUser: req.body.senhaUser,
            }
        }).then(function(findContato){
            req.session.loggedin = true;
            req.session.username = findContato.userUser;
            req.session.idUser = findContato.idUser;
            res.redirect('/contatos');
        }).catch(function(erro){
            req.session.loggedin = false;
            res.redirect('/');
        }); 
    }).catch(function(erro){
        res.render('layouts/mainErro');
    });
});
//INSERIR CONTATO
app.post('/envioCont', function (req, res) {
    if(req.session.loggedin == true)
    {  
        contUsers.create({
            nomeContato: req.body.nomeContato,
            emailContato: req.body.emailContato,
            telefoneContato: req.body.telefoneContato,
            nascContato: req.body.nascContato,
            UserIdUser: req.session.idUser,
        }).then(function(){
            res.redirect('/contatos');
        }).catch(function(erro){
            alert('Os campos nome e telefone são obrigatorios.');
        });
    }
    else
    {
        res.redirect('/');
    }
});
//LOGAR USUARIO
app.post('/envioLogin', function (req, res) {
    if(req.session.loggedin == true)
    {   
        res.redirect('/contatos');
    }
    else
    {
        Users.findOne({
            where: { 
                userUser: req.body.userUser,
                senhaUser: req.body.senhaUser,
            }
        }).then(function(findContato){
            req.session.loggedin = true;
            req.session.username = findContato.userUser;
            req.session.idUser = findContato.idUser;
            res.redirect('/contatos');
        }).catch(function(erro){
            req.session.loggedin = false;
            res.redirect('/');
        });
    }
});
//MOSTRAR PERFIL USUARIO
app.get('/envioLogout', function (req, res) {
    req.session.loggedin = false;
    req.session.username = null;
    req.session.idUser = null;
    res.redirect('/');
});
//MOSTRAR PERFIL USUARIO
app.get('/perfil', function(req, res) {
    if(req.session.loggedin == true)
    {
        Users.findOne({where: { 
                userUser: req.session.username,
                idUser: req.session.idUser,
            }
        }).then(function(findPerfil){
            res.render('layouts/perfil', {findPerfil: findPerfil});
        }).catch(function(erro){
            res.redirect('/');
        });
    }
    else
    {
        res.redirect('/');
    }
});
//MOSTRAR LISTA DE CONTATOS
app.get('/contatos', function(req, res) {
    if(req.session.loggedin == true)
    {
        contUsers.findAll({
            where: { 
                UserIdUser: req.session.idUser,
            }
        }).then(function(findContato){
            contUsers.findAndCountAll({
                where: { 
                    UserIdUser: req.session.idUser,
                }
            }).then(function(findQtContato){
                res.render('layouts/contatos', {
                    findContato: findContato,
                    findQtContato: findQtContato
                });
            }).catch(function(erro){
                res.redirect('/');
            });
        }).catch(function(erro){
            res.redirect('/');
        });
    }
    else
    {
        res.redirect('/');
    }
});
app.get('/pesquisa', function(req, res) {
    res.redirect('/contatos');
});
app.post('/pesquisa', function(req, res) {
    if(req.session.loggedin == true)
    {
        contUsers.findAll({
            where: { 
                UserIdUser: req.session.idUser,
                nomeContato: req.body.nomeContato
            }
        }).then(function(findContato){
            res.render('layouts/contatos', {findContato: findContato});
        });
    }
    else
    {
        res.redirect('/');
    }
});
//DELETAR CONTATO
app.get('/envioDel/:idContato', function (req, res) {
    contUsers.destroy({
        where: {
            'idContato': req.params.idContato
        }
    }).then(function(){
        res.redirect('/contatos');
    }).catch(function(erro){
        res.redirect('/contatos');
    });
});
app.get('/ABRIR', function (req, res) {
    res.render('partials/barra');
});
//Disponilizar server
app.listen(port, () => {
    console.log(`O server esta rodando em http://${hostname}:${port}/`);
});