/*------------------------------------------------------------------------------------------------------------
 * File Name: testClient.js
 * Created By: dxue@mozilla.com
 * Description: 
 * .tc: testCase文件，json格式，内容为接口的jsonCmd数据，exdatalength == filelen(testData)表示需要发送testData文件内容
 * .tcd: testData文件，字符串格式，一般位超过2048字节的数据
 * .atc: autoTest文件，json数组格式，从0开始执行的一系列testCase
 * 单独测试手机端接口函数：
 * ./testClient ./unit/contact/getAllContacts.tc
 * ./testClient ./unit/music/addMusic.tc ./unit/music/musicData.tcd
 * 批量测试手机端接口函数：
 * ./testClient ./unit/autoTest.atc
 *----------------------------------------------------------------------------------------------------------*/

#include <netinet/in.h>    // for sockaddr_in
#include <sys/types.h>    // for socket
#include <sys/socket.h>    // for socket
#include <stdio.h>        // for printf
#include <stdlib.h>        // for exit
#include <string.h>        // for bzero
#include <dirent.h>
#include "cJSON.h"

#define SERVER_PORT    10010
#define BUFFER_SIZE 51200
#define PACKAGE_SIZE 40960
#define FILE_NAME_MAX_SIZE 512

int runOneTestCase(char * testCase, char * testData);

int main(int argc, char **argv)
{
    system("adb forward tcp:10010 tcp:10010");
    if ((argc != 2)&&(argc != 3)){
        printf("Error: Please select .tc or .atc like \"./client ./unit/autoTest.atc\"\n");
        exit(1);
    }else{
		//判断参数是否合法
		if(!argv[1]||!strcmp(argv[1],"")||(strlen(argv[1])<strlen("*.tc"))){
			printf("Error: Please input available argv[1] name(*.tc/*.atc)\n");
			exit(1);
		}
		char *ptr = argv[1] + strlen(argv[1]) - strlen(".atc");
		if(!strcmp(ptr,".atc")){
			//读取autoTest文件内容
			char buffer[BUFFER_SIZE];
			bzero(buffer,BUFFER_SIZE);
			FILE * fp = fopen(argv[1],"r");
			if(NULL == fp ){
				printf("Error:\t%s Can Not Open To Read\n", argv[1]);
				exit(1);
			}
			fseek(fp,0,SEEK_END);
			int length = (ftell(fp)> BUFFER_SIZE?BUFFER_SIZE:ftell(fp));
			printf("%s File Length is:%d\n",argv[1], length);
			fseek(fp,0,SEEK_SET);
			int read_length = fread(buffer,sizeof(char),length,fp);
			if (read_length<length){
				printf("Error:\t%s Read Failed\n", argv[1]);
				exit(1);
			}   
			close(fp);
			
			//将文件内容转换为json，判断文件格式合法性
			cJSON *json = cJSON_Parse(buffer);
			if (!json) {
				printf("Error： %s format failed before: [%s]\n",argv[1],cJSON_GetErrorPtr());
				exit(1);
			}
			int i=0;
			int testCaseNum = cJSON_GetArraySize(json);
			printf("testCase number is %d\n",testCaseNum);
			for(i=0; i<testCaseNum; i++){
				cJSON *jsonItem = cJSON_GetArrayItem(json,i);
				if (!jsonItem) {
					printf("Error： %s format failed before: [%s]\n",argv[1], cJSON_GetErrorPtr());
					continue;
				}
				printf("testCase is %s\n",cJSON_GetObjectItem(jsonItem,"testCase")->valuestring);
				printf("testData is %s\n",cJSON_GetObjectItem(jsonItem,"testData")->valuestring);
				runOneTestCase(cJSON_GetObjectItem(jsonItem,"testCase")->valuestring, 
								cJSON_GetObjectItem(jsonItem,"testData")->valuestring);
			}
			cJSON_Delete(json);
		}
		else{
			runOneTestCase(argv[1], argv[2]);
		}
	} 
	
}

int runOneTestCase(char * testCase, char * testData)
{	
	printf("Info: Start unit testDase: %s testData %s\n", testCase, testData);
	//判断参数是否合法
	if(!testCase||!strcmp(testCase,"")||(strlen(testCase)<strlen("*.tc"))){
		printf("Error: Please input available testCase name(*.tc)\n");
		return 1;
	}
	char *ptr = testCase + strlen(testCase) - strlen(".tc");
	if(strcmp(ptr,".tc")){
		printf("Error: Please input available testCase name(*.tc)\n");
		return 1;
	}
	
	//读取testCase文件内容
	char buffer[BUFFER_SIZE];
	bzero(buffer,BUFFER_SIZE);
	FILE * fp = fopen(testCase,"r");
	if(NULL == fp ){
		printf("Error:\t%s Can Not Open To Read\n", testCase);
		return 1;
	}
	fseek(fp,0,SEEK_END);
	int length = (ftell(fp)> BUFFER_SIZE?BUFFER_SIZE:ftell(fp));
	printf("File Length is:%d\n", length);
	fseek(fp,0,SEEK_SET);
	int read_length = fread(buffer,sizeof(char),length,fp);
	if (read_length<length){
		printf("Error:\t%s Read Failed\n", testCase);
		return 1;
	}   
	close(fp);
	
	//将文件内容转换为json，判断文件格式合法性
	cJSON *json;
	json=cJSON_Parse(buffer);
	if (!json) {
		printf("Error： testCase format failed before: [%s]\n",cJSON_GetErrorPtr());
		return 1;
	}
	//cJSON_GetObjectItem(jsonItem,"data")->valuestring;
	/*
	// 将json转换为字符串
	char *out;
	out=cJSON_Print(json);
	printf("%s\n",out);
	free(out);
	*/
	
	//与server建立连接
	//设置一个socket地址结构client_addr,代表客户机internet地址, 端口
    struct sockaddr_in client_addr;
    bzero(&client_addr,sizeof(client_addr)); //把一段内存区的内容全部设置为0
    client_addr.sin_family = AF_INET;    //internet协议族
    client_addr.sin_addr.s_addr = htons(INADDR_ANY);//INADDR_ANY表示自动获取本机地址
    client_addr.sin_port = htons(0);    //0表示让系统自动分配一个空闲端口
    //创建用于internet的流协议(TCP)socket,用client_socket代表客户机socket
    int client_socket = socket(AF_INET,SOCK_STREAM,0);
    if( client_socket < 0){
        printf("Error: Create Socket Failed!\n");
        return 1;
    }
    //把客户机的socket和客户机的socket地址结构联系起来
    if( bind(client_socket,(struct sockaddr*)&client_addr,sizeof(client_addr))){
        printf("Error: Client Bind Port Failed!\n"); 
        return 1;
    }
    //设置一个socket地址结构server_addr,代表服务器的internet地址, 端口
    struct sockaddr_in server_addr;
    bzero(&server_addr,sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    //服务器的IP地址来自程序的参数
    if(inet_aton("127.0.0.1",&server_addr.sin_addr) == 0) {
        printf("Error: Server IP Address Error!\n");
        return 1;
    }
    server_addr.sin_port = htons(SERVER_PORT);
    socklen_t server_addr_length = sizeof(server_addr);
    //向服务器发起连接,连接成功后client_socket代表了客户机和服务器的一个socket连接
    if(connect(client_socket,(struct sockaddr*)&server_addr, server_addr_length) < 0){
        printf("Error: Can Not Connect To 127.0.0.1!\n");
        return 1;
    }
    
	//将testCase发送到server
	send(client_socket,buffer,read_length,0);
	printf("Send testCase is:\t%s \n", buffer);
	
	//判断是否发送testData
	int exdataLength = cJSON_GetObjectItem(json,"exdatalength")->valueint; 
	printf("Send exdataLength is:\t%d \n", exdataLength);
	if(exdataLength > 0){
		//接收服务器返回
		bzero(buffer,BUFFER_SIZE);
		recv(client_socket,buffer,BUFFER_SIZE,0);
		printf("Can Send Exdata\n");
		//判断参数是否合法
		if(!testData||!strcmp(testData,"")||(strlen(testData)<strlen("*.tcd"))){
			printf("Error: Please input available testData name(*.tcd)\n");
			return 1;
		}
		ptr = testData + strlen(testData) - strlen(".tcd");
		if(strcmp(ptr,".tcd")){
			printf("Error: Please input available testData name(*.tcd)\n");
			return 1;
		}
		//读取testData文件内容（将json转换为字符串）
		char testdata[PACKAGE_SIZE];
		bzero(testdata,PACKAGE_SIZE);
		fp = fopen(testData,"r");
		if(NULL == fp ){
			printf("Error:\t%s Can Not Open To Read\n", testData);
			return 1;
		}
		fseek(fp,0,SEEK_END);
		if(ftell(fp) != exdataLength){
			printf("Error:\t%s length not match with testCase exdatalength\n", testData);
			return 1;
		}
		fseek(fp,0,SEEK_SET);
		while(exdataLength > 0){
			int read_length = fread(testdata,sizeof(char),PACKAGE_SIZE,fp);
			//将testData发送到server
			printf("Send testData is:\t%s \n", testdata);
			//向服务器发送testdata中的数据
			send(client_socket,testdata,read_length,0);
			exdataLength -= read_length;
			printf("Send exdata last is:\t%d \n", exdataLength);
		}
		close(fp);
	}
	cJSON_Delete(json);
	
	//接收服务器返回
	bzero(buffer,BUFFER_SIZE);
	length = recv(client_socket,buffer,BUFFER_SIZE,0);
	printf("Recv Data is:\t%s \n", buffer);
	cJSON *jsonRecv;
	jsonRecv=cJSON_Parse(buffer);
	if (!jsonRecv) {
		printf("Error： Recv data format failed before: [%s]\n",cJSON_GetErrorPtr());
		return 1;
	}
	int recvExdataLength = cJSON_GetObjectItem(jsonRecv,"exdatalength")->valueint; 
	
	if(recvExdataLength > 0){   
		cJSON_ReplaceItemInObject(jsonRecv,"result",cJSON_CreateNumber(2048));
		cJSON_ReplaceItemInObject(jsonRecv,"data",cJSON_CreateString(""));
		bzero(buffer,BUFFER_SIZE);
		strcpy(buffer,cJSON_PrintUnformatted(jsonRecv));
		send(client_socket,buffer,strlen(buffer),0);
	}
	cJSON_Delete(jsonRecv);
	printf("Info： Recv exdata length is %d\n",recvExdataLength);
	while(recvExdataLength > 0){
		bzero(buffer,BUFFER_SIZE);
		length = recv(client_socket,buffer,BUFFER_SIZE,0);
		printf("Recv Exdata is:\t%s \n", buffer);
		recvExdataLength -= length;
		printf("Info： Recv exdata last is %d\n",recvExdataLength);
	}
		
	printf("Recieve Data From Server Finished\n");
	//关闭socket
    close(client_socket);
    return 0;
}
