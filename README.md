# BDV E-commerce

BDV E-commerce é uma plataforma web de comércio eletrônico voltada para a venda de vestuário masculino e feminino. O sistema permite a navegação pelo catálogo de produtos, busca global em tempo real, gerenciamento de carrinho de compras (tanto para visitantes quanto para usuários autenticados, realizando a mesclagem automática ao fazer login), controle de estoque, painel administrativo e processamento de pagamentos.

## Funcionalidades

- Catálogo paginado de produtos com múltiplas imagens e página de detalhamento
- Busca global dinâmica de produtos com paginação
- Autenticação, cadastro e gerenciamento de perfil de usuários (com foto de perfil)
- Carrinho de compras persistente para visitantes e usuários logados
- Checkout integrado com pagamento via cartão de crédito e atualização automática de estoque
- Painel de administração com controle de usuários, cadastro de produtos e gestão de estoque
- Importação automatizada de catálogo inicial de produtos a partir de dataset CSV

## Uso

1. Clone o repositório e instale as dependências:
```bash
git clone git@github.com:ravsil/e-commerce.git
cd e-commerce
npm install
```

2. Configure as variáveis de ambiente copiando o arquivo de exemplo:
```bash
cp .env.example .env
node ace generate:key
```

3. Execute as migrações do banco de dados:
```bash
make migrate
```

4. (Opcional) Popule o banco de dados com o catálogo inicial de produtos:
```bash
make seed
```

5. Inicie o servidor de desenvolvimento:
```bash
make run
```
