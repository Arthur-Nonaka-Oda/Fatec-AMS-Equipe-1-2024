Instruções

1. Ao terminar de gravar a tela do video, salvar o arquivo de vídeo em alguma pasta do projeto, sem usar a janela de salvar como do sistema. Apos isto já colocar na lista de videos disponiveis para uso

2. Usar o vuejs, pode ser de cdn para manipulação dos dados

3. na parte do rodape e direita colocar timeline e previa do video, como ser fosse o premiere, ver nesse exemplo: https://dribbble.com/shots/23872038-mecil-AI-Video-Generator

4. a timeline podera incluir varios videos na sequencia, estudar arrasta o video para o final da timeline, ou simplismente clicar no video e aparece um menu com o texto "Usar este vídeo"

5. Prévia, nao ha necessidade de colocar o nome do arquivo, apenas a duração conforme imagem do exemplo

6. Na timeline, estudar a opção de cortar o vídeo, trabalhar bem a questao das instancias de cada video, por exemplo, para cada video adicionado na timeline, ele sera uma instancia de um objeto, com propriedades por exemplo de inicio e fim(corte por exemplo). e cada instancia deve estar dentro de um array final, que no caso é o video todo

7. preparar a classe e converter os dados para a linguagem da biblioteca fluent-ffmeeg