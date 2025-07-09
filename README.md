
# bet365-scraper, scrape Bet365 live score, include soccer and basketball, score and odds.
# bet365 爬虫，抓取websocket数据，可以获取bet365的滚球，包括队伍信息实时比分、实时赔率。

# English
#### Function:
Retrieve Live Football and Basketball Match Information from Bet365.

#### Features:
Get real-time football and basketball match information from Bet365, including teams, time, and score, encapsulated as an HTTP service for easy access.

#### Principle:
Intercept WebSocket messages from Bet365’s webpage in the browser and send the data to an HTTP API service.

#### Deployment and Installation Steps:
1.Install the Chrome extension chrome_extension on Chrome.

2.Set up a Python environment and install the required libraries, Flask and Flask-CORS.

3.Run local_api.py ,for better HTTP performance, you may deploy a dedicated web server.

4.Open the browser extension panel and configure the upload URL to ensure data is successfully sent to local_api, the default URL is already set to http://127.0.0.1:8485/data

5.Open the Bet365 live betting page in your browser.Note that if you open the Chinese version, you must first change the language variable in local_api.py to "cn".

#### How to Use the API:
1.Get Football Matches (GET):

http://127.0.0.1:8485/live?sport=1

2.Get Basketball Matches (GET):

http://127.0.0.1:8485/live?sport=18

3.Get websocket raw data(GET)：

http://127.0.0.1:8485/data

4.Soccer Goal Line (GET)：

http://124.156.195.77:8365/b365/soccer/test/oneHd2allEv/C1-G15?lang=en

### Any question contact
This project can only capture limited data, more data please contact

Telegram: https://t.me/JoeBili

# 中文
#### 功能：
获取bet365的足球篮球滚球比赛信息，包括队伍、时间、比分，封装为http以便读取。

#### 原理：
拦截浏览器中bet365网页的websocket消息，通过http发送到接口服务。

#### 部署和安装步骤：
1.在chrome上安装浏览器插件chrome_extention。

2.部署python环境，安装好第三方库flask和flask_cors。

3.运行local_api.py，如果为了更好的http接口性能可以自行部署专用的web。

4.在浏览器插件中打开面板，配置upload url，确保数据能上传到local_api，默认已经配置都是http://127.0.0.1:8485/data

5.在浏览器中打开bet365的滚球页面。注意如果打开的是英文版，要先将local_api.py中的language变量改为en。

#### 如何调用接口:
1.获取足球(GET)：

http://127.0.0.1:8485/live?sport=1

2.获取篮球(GET)：

http://127.0.0.1:8485/live?sport=18

3.获取websocket原始数据(GET)：

http://127.0.0.1:8485/data

4.足球大小球指数(GET)：

http://124.156.195.77:8365/b365/soccer/test/oneHd2allEv/C1-G15

### 问题交流
此项目只能抓取有限数据，更多数据联系

Telegram: https://t.me/JoeBili

企鹅q：3403027828
