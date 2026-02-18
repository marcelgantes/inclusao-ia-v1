#!/bin/bash

echo "🚀 Iniciando configuração automática do Inclusão IA..."

# 1. Criar o arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📄 Criando arquivo .env a partir do .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado com sucesso!"
else
    echo "ℹ️  Arquivo .env já existe. Pulando criação."
fi

# 2. Instalar dependências usando pnpm
echo "📦 Instalando dependências (isso pode levar um minuto)..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "⚠️  pnpm não encontrado. Tentando com npm..."
    npm install
fi

echo "✨ Configuração concluída!"
echo "👉 Para rodar o projeto, digite: pnpm dev"
