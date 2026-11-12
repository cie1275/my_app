# my_app
#起動コマンド
#npm run dev
#DB起動コマンド
#sudo service postgresql start
#WindowsPowerShellを開きこれを最初に打つ
#cd ~/Downloads
#WindowsPowerShellでDownloadファイルまで移動しこれを打つ
ssh -i "latelier-key.pem" ubuntu@<EC2のパブリックIP>
#その後 cd my_appをする
#あとは以下のコードを起動する
#npm run build
# ビルド完了後、以下で起動
npx next start -H 0.0.0.0 -p 3000