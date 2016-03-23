#!/bin/sh

if [ $1 = "run" ]; then 
    export JUBO_PATH=$(pwd)
    meteor --settings settings.json --port 4000
elif [ $1 = "install" ]; then
    cd $JUBO_PATH && 
    rm -rf .packages &&
    mkdir -p .packages  && 
    cd .packages && 
    git clone $2  
elif [ $1 = "update" ]; then
    mv $JUBO_PATH/.packages/* $JUBO_PATH/packages
elif [ $1 = "load" ]; then
    cd $JUBO_PATH && 
    meteor add $2
fi

