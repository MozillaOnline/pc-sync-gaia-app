CXX = gcc
INCLUDEDIR = -I./ 
LDFLAGS = -L./
OBJS=cJSON.o

all : testClient 
.PHONY : all
testClient: cJSON.o
	$(CXX) -o $@ testClient.c $(OBJS) $(LDFLAGS) $(INCLUDEDIR) -lm

cJSON.o : cJSON.c cJSON.h
 $(CXX) = -c cJSON.c
 
clean:
	rm -f  *.a *.o testClient 
