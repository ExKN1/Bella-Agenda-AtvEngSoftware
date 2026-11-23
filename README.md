# Bella Agenda — Aplicativo de Reservas de Serviços

Projeto para a **Atividade Avaliativa Individual 03**. Implementa três funcionalidades do tema, sem contar login. Linguagem: JavaScript. Interface: HTML e CSS. Não é necessário instalar bibliotecas.

## Como executar

1. Extraia o ZIP para uma pasta.
2. Abra `Bella_Agenda.html` em um navegador moderno (Chrome, Edge ou Firefox). Esse arquivo reúne a interface completa. A versão com código separado está em `dist/index.html`.
3. Escolha um serviço, profissional, data e horário. Informe um nome e confirme a reserva.
4. Em **Minhas reservas**, clique em **Pagar (simulação)** e conclua a demonstração.

Para armazenamento mais previsível e sincronização entre abas, use um servidor local. Com Node.js instalado, abra um terminal nesta pasta e execute:

```text
node server.cjs
```

Depois acesse `http://127.0.0.1:4173`. Para encerrar, pressione Ctrl+C. Não execute o servidor por duplo clique.

## As três funcionalidades avaliáveis

| Funcionalidade | Aplicação prática e lógica |
| --- | --- |
| Consulta de agenda | Filtra serviços e profissionais habilitados. Gera horários a cada 15 minutos e respeita duração do serviço, expediente, domingos, datas passadas e reservas existentes. |
| Reserva de serviços | Registra cliente, serviço, profissional, data, horário e preço. Revalida disponibilidade antes de salvar e bloqueia sobreposição. Permite listar, filtrar e cancelar; o cancelamento libera a vaga. |
| Pagamento demonstrativo | Permite escolher Pix ou cartão simulados. Altera o estado para pago, registra data e valor, impede pagamento duplicado e gera comprovante de texto para download. |

## Organização do código

- `dist/index.html`: estrutura, formulários e janelas de diálogo.
- `dist/styles.css`: aparência e adaptação a celular e computador.
- `dist/model.js`: catálogo e regras de disponibilidade, reserva, pagamento e cancelamento.
- `dist/app.js`: eventos, interface, persistência local e comprovante.
- `Bella_Agenda.html`: cópia completa em um arquivo para abrir diretamente.
- `server.cjs`: servidor local opcional, sem dependências externas.
- `test.cjs`: testes automatizados das regras de negócio.

Os comentários no código estão em português. Valores monetários são armazenados em centavos para evitar erros com números decimais.

## Testes

Com Node.js instalado:

```text
node test.cjs
```

Verifica conflito de horários, duração, profissional habilitado, domingo, datas inválidas/passadas, nome, Pix, cartão, pagamento duplicado, cancelamento, liberação da vaga e serialização em JSON.

Para testar manualmente: crie uma reserva, recarregue, pague, abra o comprovante, cancele e confira a liberação do horário. Teste também filtros e uma data de domingo. Para uma demonstração limpa, use um perfil de navegador separado.

## Limitações do protótipo

- **Não processa pagamentos reais** e não coleta números de cartão. Pix e cartão são simulados; o comprovante não tem valor fiscal.
- Os dados ficam em `localStorage`, neste navegador e nesta origem. Não existe servidor de dados compartilhado, autenticação ou agenda sincronizada entre dispositivos. Limpar dados do navegador apaga reservas; abrir por arquivo, servidor ou site usa armazenamentos separados.
- No servidor local e em HTTPS, Web Locks serializa operações entre abas quando o navegador suporta a API. O evento de armazenamento atualiza as outras abas. Isso não substitui validação transacional de um servidor para múltiplos usuários.
- Horários seguem a data e o fuso do navegador. O expediente demonstrativo é de segunda a sábado, 9h às 18h, sem feriados ou pausas.
- Reservas pendentes bloqueiam o horário até serem canceladas; não há expiração automática.
- Cancelamento de uma reserva paga preserva o registro do pagamento simulado. Não existe operação real de estorno.
- Profissionais e serviços são fictícios. É uma aplicação acadêmica funcional, não um sistema pronto para operação comercial.
- A fonte externa é opcional; a interface usa uma fonte alternativa se estiver offline.

